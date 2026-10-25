import { api, unwrap } from "@/lib/api/client";

// ===== Đổi dữ liệu BE (868d933) về hình dạng màn hình đang dùng (giống mock) → màn hình không phải sửa =====

// Thẻ đơn: BE trả phẳng firstItemName / firstItemThumbnail.
// [CHỜ BE] summary chưa có expectedDeliveryDate, refundAmount, returnRequestId → thẻ đơn ẩn các dòng đó
const toSummary = ({ firstItemName, firstItemThumbnail, ...o }) => ({
  ...o,
  firstItem: firstItemName
    ? { name: firstItemName, thumbnailUrl: firstItemThumbnail }
    : null,
});

// Chi tiết: giá món tên priceAtOrder; địa chỉ giao là 3 field phẳng
// (+ shippingWardName / shippingProvinceName khi BE trả thêm [CHỜ BE])
const toDetail = (o) => ({
  ...o,
  items: (o.items ?? []).map((it) => ({ ...it, price: it.priceAtOrder })),
  shippingAddress: {
    recipientName: o.shippingRecipientName,
    phone: o.shippingPhone,
    addressDetail: o.shippingAddressDetail,
    wardName: o.shippingWardName ?? null,
    provinceName: o.shippingProvinceName ?? null,
  },
});

// Hành trình GHN: chữ mô tả tên description; xếp mới nhất trước như mock
const toTracking = (t) => ({
  ...t,
  events: [...(t.events ?? [])]
    .map((e) => ({ ...e, label: e.description ?? null }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
});

// API 59. Chỉ MEMBER. Trả MẢNG đơn (tách theo kho): {id, orderNo, warehouseId, subtotal,
// shippingFee, totalAmount, status, paymentDeadline}. KHÔNG có tên kho (checkout tự điền)
// - Không gửi productIds → đặt CẢ GIỎ; 1 món không còn bán → 409 cả lần; xong BE xoá món khỏi giỏ
// - Có productIds → chỉ đặt các món đó, BE KHÔNG xoá khỏi giỏ (app tự xoá)
export async function createOrders({ shippingAddressId, productIds }) {
  const body = productIds?.length
    ? { shippingAddressId, productIds }
    : { shippingAddressId };
  return unwrap(await api.post("/orders", body));
}

// API 62. Nhiều trạng thái gửi nối dấu phẩy (BE tách theo ","). statusCounts = số đơn mỗi trạng thái
export async function getOrders({ statuses = [], page = 0, size = 10 }) {
  const params = {
    page,
    size,
    ...(statuses.length ? { status: statuses.join(",") } : {}),
  };
  const { orders, statusCounts } = unwrap(await api.get("/orders", { params }));
  return { ...orders, content: orders.content.map(toSummary), statusCounts };
}

// API 63
export async function getOrder(id) {
  return toDetail(unwrap(await api.get(`/orders/${id}`)));
}

// API 64
export async function getTracking(id) {
  return toTracking(unwrap(await api.get(`/orders/${id}/tracking`)));
}

// API 65 — PENDING_PAYMENT / PAID; 409 CANNOT_CANCEL_AFTER_PACKING khi kho đã đóng gói,
// ORDER_ALREADY_CANCELLED. Đã trả tiền → refundAmount hoàn vào ví
export async function cancelOrder(id) {
  return unwrap(await api.post(`/orders/${id}/cancel`));
}

// API 66 — 409 khi đơn chưa giao
export async function confirmReceipt(id) {
  return unwrap(await api.post(`/orders/${id}/confirm-receipt`));
}

// API 67 — 1..5, chỉ COMPLETED. BE nhận thêm comment (app chưa có ô nhập)
export async function rateOrder(id, serviceRating) {
  return unwrap(await api.post(`/orders/${id}/rating`, { serviceRating }));
}
