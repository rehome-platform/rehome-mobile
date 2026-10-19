import { api, unwrap } from "@/lib/api/client";

// API 59 (đọc code BE 19/10). Chỉ MEMBER. Trả MẢNG đơn (tách theo kho): {id, orderNo, warehouseId, subtotal,
// shippingFee, totalAmount, status, paymentDeadline}. KHÔNG có tên kho.
// - Không gửi productIds → đặt CẢ GIỎ; 1 món không còn bán → 409 cả lần (không đơn nào được tạo); xong BE xoá món khỏi giỏ
// - Có productIds → chỉ đặt các món đó, BE KHÔNG xoá khỏi giỏ (app tự xoá)
export async function createOrders({ shippingAddressId, productIds }) {
  const body = productIds?.length
    ? { shippingAddressId, productIds }
    : { shippingAddressId };
  return unwrap(await api.post("/orders", body));
}

// API 63 [CHỜ BE] — chưa có
export async function getOrder(id) {
  return unwrap(await api.get(`/orders/${id}`));
}
// ===== Phase 4 [CHỜ BE] — theo API_CONTRACT, chưa có trên BE (đọc code 20/10) =====

// API 62. statuses: mảng; [CHỜ BE] cách gửi nhiều trạng thái (câu 4) — tạm nối dấu phẩy
export async function getOrders({ statuses = [], page = 0, size = 10 }) {
  const params = {
    page,
    size,
    ...(statuses.length ? { status: statuses.join(",") } : {}),
  };
  return unwrap(await api.get("/orders", { params }));
}

// API 64
export async function getTracking(id) {
  return unwrap(await api.get(`/orders/${id}/tracking`));
}

// API 65 — chỉ PAID; 409 khi kho đã đóng gói
export async function cancelOrder(id) {
  return unwrap(await api.post(`/orders/${id}/cancel`));
}

// API 66 — 409 khi đơn chưa giao
export async function confirmReceipt(id) {
  return unwrap(await api.post(`/orders/${id}/confirm-receipt`));
}

// API 67 — 1..5, chỉ COMPLETED
export async function rateOrder(id, serviceRating) {
  return unwrap(await api.post(`/orders/${id}/rating`, { serviceRating }));
}
