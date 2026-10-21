// Yêu cầu rút lại hàng ký gửi (enum ItemWithdrawalStatus của BE — khớp code 2c3b597)
export const WITHDRAWAL_STATUS = {
  PENDING_PICKUP: "PENDING_PICKUP",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
};
export const WITHDRAWAL_STATUS_LABEL = {
  PENDING_PICKUP: "Chờ bạn đến kho",
  COMPLETED: "Đã bàn giao",
  EXPIRED: "Quá hạn — hàng đăng bán lại",
};

// enum WithdrawalFeePaymentMethod của BE
export const FEE_PAYMENT_METHOD = {
  WALLET: "WALLET",
  MOMO: "MOMO",
  MIXED: "MIXED",
};
export const FEE_PAYMENT_METHOD_LABEL = {
  WALLET: "trừ ví",
  MOMO: "qua MoMo",
  MIXED: "ví + MoMo",
};

// Dòng thời gian KG-15. [CHỜ BE câu 10] BE chưa có lịch sử trạng thái — mock tự ghi
export const WITHDRAWAL_EVENT_LABEL = {
  REQUESTED: "Đã gửi yêu cầu rút hàng",
  REMOVED: "Sản phẩm gỡ khỏi sàn",
  HANDED_OVER: "Đã bàn giao tại quầy",
  EXPIRED: "Quá hạn, yêu cầu tự huỷ",
  RELISTED: "Sản phẩm đăng bán lại",
};

// [GIẢ ĐỊNH theo F-034] chỉ mock dùng — màn hình lấy hạn BE trả (pickupDeadline)
export const WITHDRAWAL_LIMITS = { PICKUP_DAYS: 7 };
// ---------- Hàng xuống cấp (KG-16) — enum DegradedItemChoice của BE ----------
export const DEGRADED_CHOICE = {
  FULL_COMPENSATION: "FULL_COMPENSATION", // nhận đền đủ, món thuộc về kho
  PARTIAL_WITH_ITEM_BACK: "PARTIAL_WITH_ITEM_BACK", // nhận lại hàng + đền một phần
};
export const DEGRADED_CHOICE_LABEL = {
  FULL_COMPENSATION: "Nhận tiền đền",
  PARTIAL_WITH_ITEM_BACK: "Nhận lại hàng kèm đền một phần",
};
// [CHỜ BE câu 12] bảng DegradedItemCase chưa có cột status — chỉ mock dùng
export const DEGRADED_STATUS = {
  PENDING_DECISION: "PENDING_DECISION",
  DECIDED: "DECIDED",
};
// [GIẢ ĐỊNH theo wireframe KG-16] chỉ mock dùng — màn hình lấy hạn BE trả
export const DEGRADED_LIMITS = { DECISION_DAYS: 7, PICKUP_DAYS: 30 };
