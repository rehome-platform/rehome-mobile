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
