// Trạng thái yêu cầu trả hàng (enum ReturnRequestStatus của BE — khớp code 2c3b597)
export const RETURN_STATUS = {
  PENDING: "PENDING", // chờ kho duyệt
  APPROVED: "APPROVED", // đã duyệt, có vận đơn trả — chờ Member bàn giao GHN
  SHIPPED_BACK: "SHIPPED_BACK", // đã bàn giao, hàng đang về kho
  INSPECTING: "INSPECTING", // kho đang kiểm
  VALID: "VALID", // hợp lệ → đã hoàn tiền
  INVALID: "INVALID", // không hợp lệ → chọn cách nhận lại
  LOST: "LOST", // thất lạc khi về kho → vẫn hoàn tiền (F-136)
  CANCELLED: "CANCELLED", // kho từ chối ngay / quá hạn bàn giao
};

export const RETURN_STATUS_LABEL = {
  PENDING: "Chờ kho duyệt",
  APPROVED: "Chờ bàn giao cho GHN",
  SHIPPED_BACK: "Đang gửi về kho",
  INSPECTING: "Kho đang kiểm tra",
  VALID: "Đã hoàn tiền",
  INVALID: "Không hợp lệ",
  LOST: "Thất lạc — đã hoàn tiền",
  CANCELLED: "Đã huỷ",
};

// Dòng thời gian RT-02 (chỉ số dùng với returnStepOf)
export const RETURN_STEPS = [
  "Đã gửi yêu cầu",
  "Kho duyệt yêu cầu",
  "Bàn giao GHN",
  "Hàng về kho, kiểm định",
  "Kết quả",
];

// Chip danh sách yêu cầu trả → các trạng thái gửi BE
export const RETURN_TABS = [
  { key: "ALL", label: "Tất cả", statuses: [] },
  {
    key: "ACTION",
    label: "Cần bạn làm",
    statuses: [RETURN_STATUS.APPROVED, RETURN_STATUS.INVALID],
  },
  {
    key: "PROCESSING",
    label: "Đang xử lý",
    statuses: [
      RETURN_STATUS.PENDING,
      RETURN_STATUS.SHIPPED_BACK,
      RETURN_STATUS.INSPECTING,
    ],
  },
  {
    key: "DONE",
    label: "Xong",
    statuses: [
      RETURN_STATUS.VALID,
      RETURN_STATUS.LOST,
      RETURN_STATUS.CANCELLED,
    ],
  },
];

// Lý do theo RT-01 — chỉ ở app, ghép vào chuỗi reason gửi BE (PHASE5_GUIDE 0.4 #5)
export const RETURN_REASONS = [
  { key: "NOT_AS_DESCRIBED", label: "Không đúng mô tả hoặc ảnh" },
  { key: "WORSE_CONDITION", label: "Tình trạng tệ hơn kết luận kiểm định" },
  { key: "DAMAGED_IN_TRANSIT", label: "Hỏng hoặc bẩn khi vận chuyển" },
  { key: "WRONG_ITEM", label: "Nhận sai món" },
];

// enum InvalidReturnChoice của BE
export const INVALID_RETURN_CHOICE = {
  SHIP_BACK: "SHIP_BACK",
  WAREHOUSE_PICKUP: "WAREHOUSE_PICKUP",
};
export const INVALID_RETURN_CHOICE_LABEL = {
  SHIP_BACK: "Kho gửi lại cho bạn",
  WAREHOUSE_PICKUP: "Đến kho lấy",
};

// [CHỜ BE câu 6] BE chưa có field lý do huỷ — mock tự đặt
export const RETURN_CANCEL_REASON = {
  REJECTED: "REJECTED", // kho từ chối ngay khi duyệt
  HANDOVER_EXPIRED: "HANDOVER_EXPIRED", // quá hạn bàn giao GHN
};

// RT-01 "tối thiểu 1 ảnh · 2/5". Số ngày: [GIẢ ĐỊNH theo mục 11] — chỉ mock dùng, màn hình lấy hạn BE trả
export const RETURN_LIMITS = {
  MIN_PHOTOS: 1,
  MAX_PHOTOS: 5,
  HANDOVER_DAYS: 3,
  PICKUP_DAYS: 7,
};
