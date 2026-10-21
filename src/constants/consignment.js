// Theo enum BE (đã đối chiếu entity 17/10): ConsignmentFormStatus, ProductStatus, EndOfTermChoice
export const FORM_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

export const FORM_STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã huỷ",
};

export const PRODUCT_STATUS = {
  ON_SALE: "ON_SALE",
  RESERVED: "RESERVED", // đã có đơn
  SOLD: "SOLD",
  WITHDRAWN: "WITHDRAWN",
  UNCLAIMED: "UNCLAIMED",
  DONATED: "DONATED",
  DESTROYED: "DESTROYED",
};

export const END_OF_TERM_DECISION = {
  TAKE_BACK: "TAKE_BACK",
  RE_CONSIGN: "RE_CONSIGN",
  UNCLAIMED: "UNCLAIMED",
};

// Trạng thái HIỂN THỊ (chỉ ở app), suy ra từ dữ liệu API bằng getProductView (làm ở nhánh sản phẩm)
export const PRODUCT_VIEW = {
  SELLING: "SELLING", // ON_SALE, chưa tới cuối kỳ
  HAS_ORDER: "HAS_ORDER", // RESERVED
  AWAITING_DECISION: "AWAITING_DECISION", // hết kỳ cuối, chưa chọn cách xử lý
  REPRICING: "REPRICING", // đã chọn RE_CONSIGN, chờ Moderator chốt giá
  PICKUP: "PICKUP", // đã chọn nhận lại, chờ Member đến kho lấy
  WITHDRAWING: "WITHDRAWING", // đã gửi yêu cầu rút hàng (Phase 5), chờ Member đến kho lấy
  DEGRADED_DECISION: "DEGRADED_DECISION", // hàng trả về bị hỏng, chờ Member chọn cách đền (Phase 5)
  ENDED: "ENDED", // SOLD / WITHDRAWN / UNCLAIMED / DONATED / DESTROYED
};

export const CONSIGN_LIMITS = {
  MAX_PENDING_FORMS: 5,
  MIN_PHOTOS: 1, // [GIẢ ĐỊNH]
  MAX_PHOTOS: 6, // theo KG-02 "2 / 6"
};
// Nhãn theo trạng thái hiển thị (PRODUCT_VIEW). ENDED dùng nhãn chi tiết theo PRODUCT_STATUS
export const PRODUCT_VIEW_LABEL = {
  SELLING: "Đang bán",
  HAS_ORDER: "Đã có đơn",
  AWAITING_DECISION: "Chờ cuối kỳ",
  REPRICING: "Chờ chốt giá",
  PICKUP: "Chờ nhận lại",
  WITHDRAWING: "Chờ đến kho lấy",
  DEGRADED_DECISION: "Bị hỏng — cần bạn chọn",
};

export const PRODUCT_ENDED_LABEL = {
  SOLD: "Đã bán",
  WITHDRAWN: "Đã nhận lại",
  UNCLAIMED: "Vô thừa nhận",
  DONATED: "Đã quyên góp",
  DESTROYED: "Đã huỷ",
};

// Theo enum OrderStatus của BE — tiến trình đơn ở KG-09 "Đã có đơn"
export const ORDER_STEPS = [
  { value: "PAID", label: "Đã thanh toán" },
  { value: "PACKING", label: "Đã đóng gói" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
];
