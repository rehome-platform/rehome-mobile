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
  MESSAGE_RATE_LIMITED: "MESSAGE_RATE_LIMITED", // chat: gửi quá nhanh (429, 3.13.2)
  CANNOT_CANCEL_AFTER_PACKING: "CANNOT_CANCEL_AFTER_PACKING", // huỷ đơn: kho đã đóng gói (API 65, 409) — BE đang để trong message [CHỜ BE]
  // Đổi địa chỉ giao trên đơn (PATCH /orders/{id}/shipping-address, hướng A — BE #212)
  CANNOT_CHANGE_ADDRESS_AFTER_PACKING: "CANNOT_CHANGE_ADDRESS_AFTER_PACKING", // 409: kho đã đóng gói
  ADDRESS_ALREADY_CHANGED: "ADDRESS_ALREADY_CHANGED", // 409: mỗi đơn chỉ đổi 1 lần
  SHIPPING_FEE_INCREASED: "SHIPPING_FEE_INCREASED", // 409: đơn đã trả tiền mà địa chỉ mới phí ship cao hơn
  ORDER_NOT_DELIVERED: "ORDER_NOT_DELIVERED", // xác nhận nhận hàng khi đơn chưa giao (API 66, 409) [GIẢ ĐỊNH tên mã]
  BELOW_MIN_PAYOUT: "BELOW_MIN_PAYOUT", // rút tiền: dưới mức tối thiểu (API 76, 409) — BE đang để trong message [CHỜ BE]
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE", // rút tiền / trả bằng ví: không đủ số dư khả dụng (409)
  DAILY_PAYOUT_LIMIT_REACHED: "DAILY_PAYOUT_LIMIT_REACHED", // rút tiền: hết lượt trong ngày (409)
  RETURN_WINDOW_EXPIRED: "RETURN_WINDOW_EXPIRED", // trả hàng: quá 3 ngày kể từ lúc giao (API 79, 409) — contract để trong message [CHỜ BE]
  RETURN_ALREADY_EXISTS: "RETURN_ALREADY_EXISTS", // trả hàng: đơn đã có yêu cầu (API 79, 409) [GIẢ ĐỊNH tên mã]
  RETURN_HANDOVER_EXPIRED: "RETURN_HANDOVER_EXPIRED", // trả hàng: quá hạn bàn giao GHN (API 81, 409) [GIẢ ĐỊNH tên mã]
  PRODUCT_ALREADY_ORDERED: "PRODUCT_ALREADY_ORDERED", // rút hàng: món vừa có người đặt (API 90, 409) — contract để trong message [CHỜ BE]
  INCOMPLETE_OUTFIT: "INCOMPLETE_OUTFIT", // thử đồ: chưa đủ Áo + Quần hoặc Đầm (API 97, 409) — contract để trong message [CHỜ BE]
  CAMPAIGN_LIMIT_REACHED: "CAMPAIGN_LIMIT_REACHED", // chiến dịch: đã có đủ chiến dịch đang mở (409) — BE 2c9533b
  CAMPAIGN_WAREHOUSE_HAS_PENDING: "WAREHOUSE_HAS_PENDING_PICKUP", // sửa chiến dịch: bỏ kho còn lượt chờ lấy (409) — BE 2c9533b
  CAMPAIGN_WAREHOUSE_INVALID: "INVALID_WAREHOUSE_IDS", // mã mobile tự đặt: BE chỉ trả 400 "warehouseIds không hợp lệ." (kho không còn / mã kho cũ)
  TRYON_LIVE_QUOTA_EXCEEDED: "TRYON_LIVE_QUOTA_EXCEEDED", // thử đồ AI real-time: hết lượt theo gói (429)
  TRYON_IMAGE_QUOTA_EXCEEDED: "TRYON_IMAGE_QUOTA_EXCEEDED", // phối đồ AI (ảnh): hết lượt hôm nay theo gói (429)
  // Báo cáo vi phạm (BE ee01f91)
  DUPLICATE_PENDING_REPORT: "DUPLICATE_PENDING_REPORT", // đã báo cáo đối tượng này, báo cáo cũ còn chờ xử lý (409)
  CAMPAIGN_HIDDEN: "CAMPAIGN_HIDDEN", // chiến dịch bị Moderator ẩn: không đóng / ghi note được (409)
  POST_ALREADY_REMOVED: "POST_ALREADY_REMOVED", // sửa bài đã bị Moderator gỡ (409) — BE #250; message BE đã là câu tiếng Việt
  // Quyên góp món ký gửi (đặc tả gửi BE 11/11 — [CHỜ BE] chốt tên mã)
  PRODUCT_NOT_DONATABLE: "PRODUCT_NOT_DONATABLE", // món không ở trạng thái được quyên góp (409)
  WITHDRAWAL_PENDING_APPROVAL: "WITHDRAWAL_PENDING_APPROVAL", // yêu cầu rút hàng còn chờ duyệt (409)
  CAMPAIGN_NOT_ACCEPTING: "CAMPAIGN_NOT_ACCEPTING", // chiến dịch đã đóng / hết hạn (409)
  CAMPAIGN_NOT_AT_WAREHOUSE: "CAMPAIGN_NOT_AT_WAREHOUSE", // chiến dịch không nhận đồ tại địa điểm giữ món (409)
  // Gói thành viên (BE MembershipServiceImpl)
  MEMBERSHIP_PLAN_NOT_FOUND: "MEMBERSHIP_PLAN_NOT_FOUND", // 404
  MEMBERSHIP_PLAN_NOT_PURCHASABLE: "MEMBERSHIP_PLAN_NOT_PURCHASABLE", // gói vừa ngừng bán (409)
  MEMBERSHIP_PLAN_YEARLY_NOT_AVAILABLE: "MEMBERSHIP_PLAN_YEARLY_NOT_AVAILABLE", // gói không bán theo năm (400)
  MEMBERSHIP_PAYMENT_PENDING: "MEMBERSHIP_PAYMENT_PENDING", // đang có giao dịch mua gói chờ thanh toán (409)
  // Voucher khi đặt hàng (POST /orders voucherCode) — sai mã thì không tạo đơn nào
  VOUCHER_NOT_FOUND: "VOUCHER_NOT_FOUND", // 404
  VOUCHER_FORBIDDEN: "VOUCHER_FORBIDDEN", // mã không thuộc về bạn (403)
  VOUCHER_ALREADY_USED: "VOUCHER_ALREADY_USED", // 409
  VOUCHER_EXPIRED: "VOUCHER_EXPIRED", // 409
  VOUCHER_MIN_ORDER_NOT_MET: "VOUCHER_MIN_ORDER_NOT_MET", // đơn chưa đủ giá trị tối thiểu (400)
  VOUCHER_NOT_APPLICABLE: "VOUCHER_NOT_APPLICABLE", // mã không giảm được gì cho đơn này (400)
};
