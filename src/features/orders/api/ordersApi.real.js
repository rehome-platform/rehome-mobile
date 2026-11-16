import { api, unwrap } from "@/lib/api/client";

// ===== Đổi dữ liệu BE (868d933) về hình dạng màn hình đang dùng (giống mock) → màn hình không phải sửa =====

// Thẻ đơn: BE trả phẳng firstItemName / firstItemThumbnail.
// Các trường còn lại (expectedDeliveryDate, refundAmount, returnRequestId, warehouseName…) BE trả sẵn, giữ nguyên
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

// API 59. Chỉ MEMBER. Trả MẢNG đơn — MỖI MÓN MỘT ĐƠN (BE 963758f, kể cả cùng kho), đúng thứ tự productIds:
// {id, orderNo, warehouseId, subtotal (= giá món), shippingFee (riêng từng đơn), totalAmount, status, paymentDeadline}.
// KHÔNG có tên món / tên kho (checkout tự điền)
// - Có productIds → đặt các món đó, BE tự xoá chúng khỏi giỏ. Checkout luôn gửi productIds
// - Không gửi productIds → đặt CẢ GIỎ (thứ tự theo giỏ của BE); 1 món không còn bán → 409 cả lần
// - voucherCode (gói thành viên): MỘT mã cho cả lần đặt, BE tự chia phần giảm về từng đơn → mỗi đơn trả
//   discountAmount + totalAmount ĐÃ trừ giảm. Lỗi mã: VOUCHER_* (400/403/404/409), không tạo đơn nào
export async function createOrders({ shippingAddressId, productIds, voucherCode }) {
  const body = {
    shippingAddressId,
    ...(productIds?.length ? { productIds } : {}),
    ...(voucherCode ? { voucherCode } : {}),
  };
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

// Đổi địa chỉ giao trên đơn trước khi đóng gói (hướng A, BE #212): PATCH /orders/{id}/shipping-address
// { shippingAddressId } → { địa chỉ, phí ship, tổng mới, addressChangedAt, refundedAmount } (đơn đã trả mà phí mới
// rẻ hơn → hoàn chênh lệch vào ví). Mỗi đơn 1 lần.
// 409: CANNOT_CHANGE_ADDRESS_AFTER_PACKING · ADDRESS_ALREADY_CHANGED · SHIPPING_FEE_INCREASED.
// Response không có danh sách món → màn hình tải lại chi tiết đơn (useOrderMutation làm mới ["orders"])
export async function changeShippingAddress(id, shippingAddressId) {
  const res = unwrap(
    await api.patch(`/orders/${id}/shipping-address`, { shippingAddressId }),
  );
  return { refundedAmount: Number(res?.refundedAmount ?? 0) };
}

// API 66 — 409 khi đơn chưa giao
export async function confirmReceipt(id) {
  return unwrap(await api.post(`/orders/${id}/confirm-receipt`));
}

// API 67 — 1..5, chỉ COMPLETED. comment: nhận xét (không bắt buộc, BE lưu ratingComment).
// imageUrls: ảnh đã upload vào ORDER_RATINGS (≤ 5, BE chỉ nhận link Cloudinary của hệ thống) — chỉ gửi khi có ảnh
export async function rateOrder(
  id,
  { serviceRating, comment, imageUrls = [] },
) {
  const body = { serviceRating, comment: comment?.trim() || null };
  if (imageUrls.length) body.imageUrls = imageUrls;
  return unwrap(await api.post(`/orders/${id}/rating`, body));
}

// Đơn đã bán: đơn có món do chính mình ký gửi (BE OrderController GET /orders/sold). Chỉ tính các món của mình;
// netAmount = tiền nhận sau hoa hồng — paidOut = false thì là số dự kiến (chưa hết hạn trả hàng)
export async function getSoldOrders({ status, page = 0, size = 10 } = {}) {
  const { orders, statusCounts } = unwrap(
    await api.get("/orders/sold", { params: { status, page, size } }),
  );
  return { ...orders, statusCounts };
}
