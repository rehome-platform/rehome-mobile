// enum NotificationType của BE (a0c6abe — khớp code)
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: "ORDER_UPDATE",
  WALLET_EVENT: "WALLET_EVENT",
  TERM_EXPIRY: "TERM_EXPIRY",
  VERIFICATION_RESULT: "VERIFICATION_RESULT",
  QUEUE_TASK: "QUEUE_TASK",
};

// Icon theo loại (Ionicons)
export const NOTIFICATION_ICON = {
  ORDER_UPDATE: "receipt-outline",
  WALLET_EVENT: "wallet-outline",
  TERM_EXPIRY: "time-outline",
  VERIFICATION_RESULT: "shield-checkmark-outline",
  QUEUE_TASK: "cube-outline",
};

// Đích để mở màn khi bấm — [CHỜ BE PHASE6_GUIDE câu 17] bảng Notification chưa có targetType/targetId
export const NOTIFICATION_TARGET = {
  ORDER: "ORDER",
  RETURN_REQUEST: "RETURN_REQUEST",
  WITHDRAWAL: "WITHDRAWAL",
  PRODUCT: "PRODUCT", // sản phẩm ký gửi của mình
  CONSIGNMENT_FORM: "CONSIGNMENT_FORM",
  PAYOUT: "PAYOUT",
  WALLET: "WALLET",
  CAMPAIGN: "CAMPAIGN",
  POST: "POST",
};

export const NOTIFICATION_LIMITS = { UNREAD_POLL_MS: 60000 };
