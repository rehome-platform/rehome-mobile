import { api, unwrap } from "@/lib/api/client";
import { WITHDRAWAL_STATUS as W } from "@/constants/withdrawal";
import { warehouseApi } from "@/features/warehouses/api/warehouseApi";

// API 90–92 (BE ItemWithdrawalRequestController). Đổi dữ liệu BE về hình dạng màn hình đang dùng (giống mock).
// BE (11/11): tạo yêu cầu → PENDING_APPROVAL + gỡ món khỏi sàn NGAY, chưa có hạn nào. Địa điểm ký gửi duyệt →
// PENDING_PICKUP + pickupDeadline + feePaymentDeadline (có phí); từ chối → REJECTED + rejectReason, món lên sàn lại.
// Phí (nếu có) CHỈ trả được sau khi duyệt, bằng ĐÚNG 1 cách WALLET | MOMO | VNPAY; quá feePaymentDeadline chưa trả →
// BE tự huỷ. Chi tiết có sẵn địa chỉ / giờ mở cửa, ảnh món, completedAt. BE chưa có lịch sử trạng thái (không có giờ
// duyệt / từ chối) → dòng thời gian dựng từ createdAt / status

// Dòng thời gian KG-15, mới nhất ở trên. Mốc không có giờ → at = null
const eventsOf = (w) => {
  const base = [
    { type: "REMOVED", at: w.createdAt },
    { type: "REQUESTED", at: w.createdAt },
  ];
  const approved = [{ type: "APPROVED", at: null }, ...base];
  if (w.status === W.REJECTED)
    return [
      { type: "RELISTED", at: null },
      { type: "REJECTED", at: null },
      ...base,
    ];
  if (w.status === W.PENDING_PICKUP) return approved;
  if (w.status === W.COMPLETED)
    return [{ type: "HANDED_OVER", at: w.completedAt ?? null }, ...approved];
  if (w.status === W.EXPIRED)
    return [
      { type: "RELISTED", at: w.pickupDeadline },
      { type: "EXPIRED", at: w.pickupDeadline },
      ...approved,
    ];
  return base; // PENDING_APPROVAL
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
  warehouseAddress: w.warehouseAddress ?? warehouse?.address ?? null,
  warehouseOpeningHours:
    w.warehouseOpeningHours ?? warehouse?.openingHours ?? null,
  photoUrl: w.photoUrl ?? null,
  feePaymentDeadline: w.feePaymentDeadline ?? null,
  events: eventsOf(w),
});

// API 90 → { id, productId, feeCharged, status: PENDING_APPROVAL } (chưa có hạn — có sau khi duyệt).
// 409 PRODUCT_ALREADY_ORDERED / ITEM_WITHDRAWAL_ALREADY_PENDING
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

// API 92. BE đã trả địa chỉ kho; chỉ khi thiếu (dữ liệu cũ) mới tra GET /warehouses theo tên
export async function getWithdrawal(id) {
  const w = unwrap(await api.get(`/item-withdrawal-requests/${id}`));
  const warehouse = w.warehouseAddress
    ? null
    : await warehouseByName(w.warehouseName);
  return toWithdrawal(w, warehouse);
}
