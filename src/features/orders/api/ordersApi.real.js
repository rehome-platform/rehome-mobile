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
