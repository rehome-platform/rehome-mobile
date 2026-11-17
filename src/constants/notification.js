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
  // Báo cáo vi phạm (BE ee01f91)
  VIOLATION_WARNING: "VIOLATION_WARNING", // tổ chức: bị cảnh cáo; targetType POST / CAMPAIGN / ORGANIZATION → mở đúng nội dung
  VIOLATION_REPORT_HANDLED: "VIOLATION_REPORT_HANDLED", // Member: báo cáo đã được xử lý (không có đích, chỉ đọc)
  // BE 1a27081 → e812dda
  DONATION_HANDED_OVER: "DONATION_HANDED_OVER",
  // [CHỜ BE — đặc tả 17/11] Member có món ký gửi đã quyên góp (targetType PRODUCT → mở trang món):
  DONATION_ON_HOLD: "DONATION_ON_HOLD", // chiến dịch tạm ngừng, ReHome tạm giữ món chờ chuyển
  DONATION_REASSIGNED: "DONATION_REASSIGNED", // đã chuyển món sang chiến dịch khác // Member: món ký gửi đã quyên góp được bàn giao (PRODUCT) · tổ chức: đã nhận n lượt (CAMPAIGN)
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED", // Member: yêu cầu rút hàng được duyệt (WITHDRAWAL)
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED", // Member: yêu cầu rút hàng bị từ chối (WITHDRAWAL)
  MEMBERSHIP_EVENT: "MEMBERSHIP_EVENT", // Member: gói thành viên mua / sắp hết / hết hạn (không có đích)
  VOUCHER_ISSUED: "VOUCHER_ISSUED", // Member: nhận voucher mới (không có đích)
  // [CHỜ BE — sửa / huỷ biên nhận, lead chốt 18/11] targetType CONSIGNMENT_RECEIPT → mở biên nhận
  RECEIPT_UPDATED: "RECEIPT_UPDATED", // Moderator sửa biên nhận chưa xác nhận
  RECEIPT_VOIDED: "RECEIPT_VOIDED", // Moderator huỷ biên nhận đã xác nhận (chưa nhập kho) → chờ bản mới
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
  VIOLATION_WARNING: "warning-outline",
  VIOLATION_REPORT_HANDLED: "flag-outline",
  DONATION_HANDED_OVER: "gift-outline",
  DONATION_ON_HOLD: "pause-circle-outline",
  DONATION_REASSIGNED: "swap-horizontal-outline",
  WITHDRAWAL_APPROVED: "checkmark-circle-outline",
  WITHDRAWAL_REJECTED: "close-circle-outline",
  MEMBERSHIP_EVENT: "ribbon-outline",
  VOUCHER_ISSUED: "pricetag-outline",
  RECEIPT_UPDATED: "create-outline",
  RECEIPT_VOIDED: "document-text-outline",
};

// Đích để mở màn khi bấm (targetType của BE). BE hiện dùng CAMPAIGN, POST, ORGANIZATION, LEGAL_CHANGE,
// DEGRADED_ITEM_CASE, WITHDRAWAL, PRODUCT
export const NOTIFICATION_TARGET = {
  ORDER: "ORDER",
  RETURN_REQUEST: "RETURN_REQUEST",
  WITHDRAWAL: "WITHDRAWAL",
  PRODUCT: "PRODUCT", // sản phẩm ký gửi của mình
  CONSIGNMENT_FORM: "CONSIGNMENT_FORM",
  CONSIGNMENT_RECEIPT: "CONSIGNMENT_RECEIPT", // [CHỜ BE] biên nhận vừa được sửa / huỷ
  PAYOUT: "PAYOUT",
  WALLET: "WALLET",
  CAMPAIGN: "CAMPAIGN",
  POST: "POST",
  ORGANIZATION: "ORGANIZATION", // hồ sơ tổ chức của mình (kết quả xác minh)
  LEGAL_CHANGE: "LEGAL_CHANGE", // yêu cầu đổi pháp lý của mình
  DEGRADED_ITEM_CASE: "DEGRADED_ITEM_CASE", // BE 11/11: nhắc Member chốt cách đền hàng xuống cấp trước hạn
};

export const NOTIFICATION_LIMITS = { UNREAD_POLL_MS: 60000 };
