// Mã lỗi màn hình được phép so sánh. Không so chữ trong message.
export const ERROR_CODES = {
  NETWORK: "NETWORK",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_BANNED: "ACCOUNT_BANNED",
  WRONG_PASSWORD: "WRONG_PASSWORD", // đổi mật khẩu: sai mật khẩu hiện tại
  NEW_PASSWORD_SAME_AS_OLD: "NEW_PASSWORD_SAME_AS_OLD", // đổi mật khẩu: mới trùng cũ
  GOOGLE_ACCOUNT_CONFLICT: "GOOGLE_ACCOUNT_CONFLICT", // email đã gắn với tài khoản Google khác
  TOO_MANY_PENDING_FORMS: "TOO_MANY_PENDING_FORMS", // ký gửi: đã có 5 form chờ duyệt (API 15, 409)
  FORM_NOT_EDITABLE: "FORM_NOT_EDITABLE", // ký gửi: form không còn Chờ duyệt (API 18, 409)
  BELOW_FLOOR_PRICE: "BELOW_FLOOR_PRICE", // giảm giá: thấp hơn giá sàn (API 23, 409)
  PRICE_CHANGE_LIMIT_REACHED: "PRICE_CHANGE_LIMIT_REACHED", // giảm giá: hôm nay đã đổi rồi (API 23, 409)
  DECISION_EXPIRED: "DECISION_EXPIRED", // cuối kỳ: quá hạn 30 ngày chọn cách xử lý (API 24, 409)
  ORGANIZATION_PROFILE_ALREADY_EXISTS: "ORGANIZATION_PROFILE_ALREADY_EXISTS", // tổ chức: tài khoản đã nộp hồ sơ (409)
  ORGANIZATION_EMAIL_TAKEN: "ORGANIZATION_EMAIL_TAKEN", // tổ chức: email liên hệ trùng (409)
  ORGANIZATION_TAX_CODE_TAKEN: "ORGANIZATION_TAX_CODE_TAKEN", // tổ chức: MST trùng (409)
  ORGANIZATION_NOT_REJECTED: "ORGANIZATION_NOT_REJECTED", // tổ chức: chỉ nộp lại khi bị từ chối (403)
};
