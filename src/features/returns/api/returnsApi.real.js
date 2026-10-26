import { api, unwrap } from "@/lib/api/client";
import { getOrder } from "@/features/orders/api/ordersApi.real";

// ===== Phase 5 — BE 51c2027: ReturnRequestController (member: tạo / danh sách / chi tiết / bàn giao / chọn cách nhận lại) =====
// BE trả ReturnRequestResponse: {id, orderId, orderNo, status, reason, photoUrls, ghnReturnTrackingCode,
// handoverDeadline, invalidReturnChoice, pickupDeadline, resolutionNote, refundAmount, createdAt, resolvedAt}
// → KHÔNG có món / tiền / địa điểm của đơn: lấy thêm đơn (API 63) rồi ghép, màn hình không phải sửa

// Đơn của yêu cầu; lỗi (đơn bị xoá, mạng chập) → null, vẫn hiện được yêu cầu
const orderOf = (orderId) => getOrder(orderId).catch(() => null);

// Field app dùng mà BE chưa có → null để màn hình tự ẩn dòng [CHỜ BE]
const MISSING = {
  code: null, // mã YC-… — màn hình tự bỏ khi null
  approvedAt: null,
  handedOverAt: null,
  inspectedAt: null,
  resolutionPhotoUrls: [],
  cancelReason: null,
  cancelNote: null,
  warehouseAddress: null, // RT-04: địa chỉ / giờ mở cửa địa điểm đang giữ hàng
  warehouseOpeningHours: null,
  shipBackFee: null, // phí ReHome gửi lại hàng không hợp lệ
};

const toDetail = (r, o) => ({
  ...MISSING,
  ...r,
  photoUrls: r.photoUrls ?? [],
  orderNo: r.orderNo ?? o?.orderNo ?? null,
  warehouseId: o?.warehouseId ?? null,
  warehouseName: o?.warehouseName ?? null,
  items: o?.items ?? [],
  subtotal: o?.subtotal ?? null,
  shippingFee: o?.shippingFee ?? null,
  totalAmount: o?.totalAmount ?? null,
  shippingRecipientName: o?.shippingRecipientName ?? null,
  shippingPhone: o?.shippingPhone ?? null,
  shippingAddressDetail: o?.shippingAddressDetail ?? null,
});

const toSummary = (r, o) => ({
  id: r.id,
  code: null,
  orderId: r.orderId,
  orderNo: r.orderNo ?? o?.orderNo ?? null,
  status: r.status,
  createdAt: r.createdAt,
  handoverDeadline: r.handoverDeadline,
  invalidReturnChoice: r.invalidReturnChoice,
  pickupDeadline: r.pickupDeadline,
  itemCount: o?.items?.length ?? 0,
  firstItem: o?.items?.[0] ?? null,
});

// API 79. reason: "<lựa chọn>: <mô tả>" (buildReasonText); photoUrls: URL sau khi upload
export async function createReturn(orderId, { reason, photoUrls }) {
  return unwrap(
    await api.post("/return-requests", { orderId, reason, photoUrls }),
  );
}

// API 80. [CHỜ BE] chưa lọc theo trạng thái → lấy 1 trang lớn rồi app tự lọc theo tab.
// Mỗi yêu cầu lấy thêm đơn để có ảnh / tên món (thường chỉ vài yêu cầu nên chấp nhận được)
export async function getReturns({ statuses = [], page = 0, size = 10 }) {
  const res = unwrap(
    await api.get("/return-requests", { params: { page: 0, size: 100 } }),
  );
  const all = (res.content ?? []).filter(
    (r) => !statuses.length || statuses.includes(r.status),
  );
  const pageItems = all.slice(page * size, (page + 1) * size);
  const orders = await Promise.all(pageItems.map((r) => orderOf(r.orderId)));
  return {
    content: pageItems.map((r, i) => toSummary(r, orders[i])),
    page,
    size,
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size),
  };
}

export async function getReturn(id) {
  const r = unwrap(await api.get(`/return-requests/${id}`));
  return toDetail(r, await orderOf(r.orderId));
}

// API 81
export async function confirmHandover(id) {
  return unwrap(await api.post(`/return-requests/${id}/handover`));
}

// API 82. choice: SHIP_BACK | WAREHOUSE_PICKUP (khớp enum InvalidReturnChoice của BE)
export async function chooseInvalidReturn(id, choice) {
  return unwrap(
    await api.post(`/return-requests/${id}/invalid-choice`, { choice }),
  );
}
