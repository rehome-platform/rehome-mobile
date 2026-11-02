import { api, unwrap } from "@/lib/api/client";
import { WITHDRAWAL_STATUS as W } from "@/constants/withdrawal";
import { warehouseApi } from "@/features/warehouses/api/warehouseApi";

// API 90–92 (BE ItemWithdrawalRequestController, 65d8475). Đổi dữ liệu BE về hình dạng màn hình đang dùng (giống mock).
// BE: tạo yêu cầu là PENDING_PICKUP + gỡ món khỏi sàn NGAY; phí (nếu có) trả riêng bằng ĐÚNG 1 cách WALLET | MOMO | VNPAY.
// [CHỜ BE] chi tiết chưa có địa chỉ / giờ mở cửa kho (tạm ghép từ GET /warehouses theo tên), ảnh món,
// lịch sử trạng thái (tạm dựng từ createdAt / status)

// Dòng thời gian KG-15, mới nhất ở trên. Mốc không có giờ (BE chưa trả) → at = null
const eventsOf = (w) => {
  const base = [
    { type: "REMOVED", at: w.createdAt },
    { type: "REQUESTED", at: w.createdAt },
  ];
  if (w.status === W.COMPLETED)
    return [{ type: "HANDED_OVER", at: null }, ...base];
  if (w.status === W.EXPIRED)
    return [
      { type: "RELISTED", at: w.pickupDeadline },
      { type: "EXPIRED", at: w.pickupDeadline },
      ...base,
    ];
  return base;
};

async function warehouseByName(name) {
  if (!name) return null;
  const list = await warehouseApi.getWarehouses().catch(() => []);
  return list.find((x) => x.name === name) ?? null;
}

const toWithdrawal = (w, warehouse) => ({
  ...w,
  feeCharged: Number(w.feeAmount ?? w.feeCharged ?? 0),
  feePaid: w.feePaid ?? Number(w.feeAmount ?? w.feeCharged ?? 0) === 0,
  feePaymentMethod: w.feePaid ? w.paymentMethod : null,
  warehouseAddress: warehouse?.address ?? null,
  warehouseOpeningHours: warehouse?.openingHours ?? null,
  photoUrl: w.photoUrl ?? null,
  events: eventsOf(w),
});

// API 90 → { id, productId, feeCharged, status: PENDING_PICKUP, pickupDeadline }. 409 PRODUCT_ALREADY_ORDERED
export async function createWithdrawal(productId) {
  const w = unwrap(await api.post("/item-withdrawal-requests", { productId }));
  const fee = Number(w.feeCharged ?? 0);
  return { ...w, feeCharged: fee, feePaid: fee === 0 };
}

// API 91 — method: WALLET | MOMO | VNPAY. Ví: trừ + chốt ngay (409 INSUFFICIENT_BALANCE khi thiếu).
// MoMo / VNPay: trả payUrl → mở trang thanh toán; kết quả về qua IPN → hỏi lại getWithdrawal().feePaid
export async function payWithdrawalFee(id, method) {
  return unwrap(
    await api.post(`/item-withdrawal-requests/${id}/pay-fee`, {
      paymentMethod: method,
    }),
  ); // { id, feeCharged, status, payUrl }
}

// API 92
export async function getWithdrawal(id) {
  const w = unwrap(await api.get(`/item-withdrawal-requests/${id}`));
  return toWithdrawal(w, await warehouseByName(w.warehouseName));
}
