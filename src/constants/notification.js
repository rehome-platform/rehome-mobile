// enum NotificationType của BE (a0c6abe — khớp code)
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: "ORDER_UPDATE",
  WALLET_EVENT: "WALLET_EVENT",
  TERM_EXPIRY: "TERM_EXPIRY",
  VERIFICATION_RESULT: "VERIFICATION_RESULT",
  QUEUE_TASK: "QUEUE_TASK",
  DONATION_RECORDED: "DONATION_RECORDED", // tổ chức: Moderator ghi nhận lượt quyên góp (kèm warehouseId)
  COMMENT_REPLIED: "COMMENT_REPLIED", // Member: tổ chức trả lời bình luận của mình
  POST_COMMENTED: "POST_COMMENTED", // tổ chức: bài viết có bình luận mới
  FOLLOWED_ORG_CAMPAIGN: "FOLLOWED_ORG_CAMPAIGN", // Member: tổ chức đang theo dõi mở chiến dịch mới (UC-44)
  FOLLOWED_ORG_POST: "FOLLOWED_ORG_POST", // Member: tổ chức đang theo dõi đăng bài mới (UC-44)
};

// Icon theo loại (Ionicons)
export const NOTIFICATION_ICON = {
  ORDER_UPDATE: "receipt-outline",
  WALLET_EVENT: "wallet-outline",
  TERM_EXPIRY: "time-outline",
  VERIFICATION_RESULT: "shield-checkmark-outline",
  QUEUE_TASK: "cube-outline",
  DONATION_RECORDED: "gift-outline",
  COMMENT_REPLIED: "chatbubble-ellipses-outline",
  POST_COMMENTED: "chatbubble-ellipses-outline",
  FOLLOWED_ORG_CAMPAIGN: "megaphone-outline",
  FOLLOWED_ORG_POST: "newspaper-outline",
};

// Đích để mở màn khi bấm (targetType của BE). BE hiện dùng CAMPAIGN, POST, ORGANIZATION, LEGAL_CHANGE
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
  ORGANIZATION: "ORGANIZATION", // hồ sơ tổ chức của mình (kết quả xác minh)
  LEGAL_CHANGE: "LEGAL_CHANGE", // yêu cầu đổi pháp lý của mình
};

export const NOTIFICATION_LIMITS = { UNREAD_POLL_MS: 60000 };
