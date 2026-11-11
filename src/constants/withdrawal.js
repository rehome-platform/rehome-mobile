// Yêu cầu rút lại hàng ký gửi (enum ItemWithdrawalStatus của BE).
// Từ BE 11/11: tạo yêu cầu → PENDING_APPROVAL (chờ địa điểm ký gửi duyệt) → duyệt: PENDING_PICKUP (lúc này mới có
// hạn đến lấy + hạn trả phí, mới trả phí được) / từ chối: REJECTED (có rejectReason, món lên sàn lại)
export const WITHDRAWAL_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  PENDING_PICKUP: "PENDING_PICKUP",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
};
export const WITHDRAWAL_STATUS_LABEL = {
  PENDING_APPROVAL: "Chờ địa điểm ký gửi duyệt",
  PENDING_PICKUP: "Chờ bạn đến địa điểm",
  REJECTED: "Bị từ chối — hàng đăng bán lại",
  COMPLETED: "Đã bàn giao",
  EXPIRED: "Quá hạn — hàng đăng bán lại",
};
// Đang giữ món khỏi sàn (BE ProductServiceImpl: cả 2 trạng thái này đều làm món WITHDRAWN)
export const ACTIVE_WITHDRAWAL_STATUSES = [
  WITHDRAWAL_STATUS.PENDING_APPROVAL,
  WITHDRAWAL_STATUS.PENDING_PICKUP,
];

// enum WithdrawalFeePaymentMethod của BE (65d8475): chọn ĐÚNG 1 cách, không chia ví + MoMo (đã bỏ MIXED)
export const FEE_PAYMENT_METHOD = {
  WALLET: "WALLET",
  MOMO: "MOMO",
  VNPAY: "VNPAY",
};
export const FEE_PAYMENT_METHOD_LABEL = {
  WALLET: "trừ ví",
  MOMO: "qua MoMo",
  VNPAY: "qua VNPay",
};

// Dòng thời gian KG-15. [CHỜ BE câu 10] BE chưa có lịch sử trạng thái — mock tự ghi
export const WITHDRAWAL_EVENT_LABEL = {
  REQUESTED: "Đã gửi yêu cầu rút hàng",
  REMOVED: "Sản phẩm gỡ khỏi sàn",
  APPROVED: "Địa điểm ký gửi đã duyệt",
  REJECTED: "Địa điểm ký gửi từ chối yêu cầu",
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
  // BE 11/11: quá decisionDeadline (30 ngày) mà Member không chọn → hệ thống tự gán, hàng vô thừa nhận, KHÔNG đền
  UNCLAIMED: "UNCLAIMED",
};
export const DEGRADED_CHOICE_LABEL = {
  FULL_COMPENSATION: "Nhận tiền đền",
  PARTIAL_WITH_ITEM_BACK: "Nhận lại hàng kèm đền một phần",
  UNCLAIMED: "Quá hạn — hàng vô thừa nhận",
};
// [CHỜ BE câu 12] bảng DegradedItemCase chưa có cột status — chỉ mock dùng
export const DEGRADED_STATUS = {
  PENDING_DECISION: "PENDING_DECISION",
  DECIDED: "DECIDED",
};
// [GIẢ ĐỊNH theo wireframe KG-16] chỉ mock dùng — màn hình lấy hạn BE trả
export const DEGRADED_LIMITS = { DECISION_DAYS: 7, PICKUP_DAYS: 30 };
