// Trạng thái đơn (enum OrderStatus của BE)
export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  PACKING: "PACKING",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};
export const ORDER_STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

// Chip BR-10 → các trạng thái gửi BE (PHASE4_GUIDE 0.4 #1)
export const ORDER_TABS = [
  { key: "ALL", label: "Tất cả", statuses: [] },
  {
    key: "PENDING",
    label: "Chờ thanh toán",
    statuses: [ORDER_STATUS.PENDING_PAYMENT],
  },
  {
    key: "PROCESSING",
    label: "Đang xử lý",
    statuses: [ORDER_STATUS.PAID, ORDER_STATUS.PACKING],
  },
  {
    key: "SHIPPING",
    label: "Đang giao",
    statuses: [ORDER_STATUS.SHIPPING, ORDER_STATUS.DELIVERED],
  },
  { key: "DONE", label: "Hoàn thành", statuses: [ORDER_STATUS.COMPLETED] },
  { key: "CANCELLED", label: "Đã huỷ", statuses: [ORDER_STATUS.CANCELLED] },
];

// Thanh 5 bước ngang ở BR-11 (orderStepOf trả chỉ số bước ĐÃ xong)
export const ORDER_STEPS = [
  "Đặt hàng",
  "Thanh toán",
  "Kho đóng gói",
  "Đang giao",
  "Hoàn thành",
];

// [CHỜ BE] Order chưa có cancelReason (PHASE4_GUIDE câu 4b) — tên mã là [GIẢ ĐỊNH]
export const CANCEL_REASON_LABEL = {
  BUYER_CANCELLED: "Bạn đã huỷ đơn khi kho chưa đóng gói.",
  PAYMENT_EXPIRED: "Đơn hết hạn thanh toán (15 phút) nên tự huỷ.",
  CARRIER_FAILED: "GHN không giao được, kiện hàng đã trả về kho.",
};

export const PAYMENT_METHOD = { MOMO: "MOMO", WALLET: "WALLET" }; // Phase 3 chỉ MoMo; Ví bật ở Phase 4

// API 52: BE trả unavailableReason = tên ProductStatus của món khi món không còn ON_SALE (đọc code 19/10)
export const CART_UNAVAILABLE_LABEL = {
  RESERVED: "Đang có người thanh toán",
  SOLD: "Đã bán",
  WITHDRAWN: "Người ký gửi đã rút hàng",
  UNCLAIMED: "Không còn bán",
  DONATED: "Không còn bán",
  DESTROYED: "Không còn bán",
};
export const unavailableLabel = (reason) =>
  CART_UNAVAILABLE_LABEL[reason] ?? "Không còn khả dụng";

export const ADDRESS_LIMIT = 5; // BR-06 — BE không giới hạn → app tự chặn
// API 64 events[].status [CHỜ BE danh sách đủ — câu 7]. Không có trong bảng → dùng chữ BE trả (label/description)
export const TRACKING_EVENT_LABEL = {
  PICKED_UP: "GHN đã lấy hàng",
  SORTED: "Đã rời kho phân loại",
  DELIVERING: "Đang giao đến bạn",
  FAILED_DELIVERY: "Giao không thành công",
  DELIVERED: "Giao thành công",
  RETURNING: "Đang trả hàng về kho",
};

// BR-14: chữ đi kèm số sao [GIẢ ĐỊNH]
export const RATING_LABEL = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất tốt",
};
