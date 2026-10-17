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
  ENDED: "ENDED", // SOLD / WITHDRAWN / UNCLAIMED / DONATED / DESTROYED
};

export const CONSIGN_LIMITS = {
  MAX_PENDING_FORMS: 5,
  MIN_PHOTOS: 1, // [GIẢ ĐỊNH]
  MAX_PHOTOS: 6, // theo KG-02 "2 / 6"
};
