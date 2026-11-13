// Gói thành viên + voucher (BE: MembershipController, VoucherController — đặc tả VIP-MEMBERSHIP-SPEC, bản chốt 14/11).
// MỌI con số quyền lợi (giá, lượt, số mã, số form) lấy từ BE — Admin sửa được, KHÔNG viết cứng ở app.

// enum MembershipTier. Thứ tự hạng: FREE < SILVER < GOLD < DIAMOND (so sánh để biết Nâng cấp / Chuyển gói)
export const TIER = {
  FREE: "FREE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  DIAMOND: "DIAMOND",
};
export const TIER_RANK = { FREE: 0, SILVER: 1, GOLD: 2, DIAMOND: 3 };
export const TIER_SHORT = {
  FREE: "Thường",
  SILVER: "Bạc",
  GOLD: "Vàng",
  DIAMOND: "Kim cương",
};

// enum BillingCycle
export const BILLING_CYCLE = { MONTHLY: "MONTHLY", YEARLY: "YEARLY" };
export const BILLING_CYCLE_LABEL = { MONTHLY: "Theo tháng", YEARLY: "Theo năm" };

// enum SubscriptionStatus
export const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REPLACED: "REPLACED",
  CANCELLED: "CANCELLED",
};

// enum PaymentStatus của lịch sử mua gói
export const PURCHASE_STATUS_LABEL = {
  SUCCESS: "Thành công",
  PENDING: "Chờ thanh toán",
  FAILED: "Thất bại",
};
export const PURCHASE_STATUS_TONE = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "danger",
};

// enum VoucherType / VoucherDiscountKind / MemberVoucherStatus
export const VOUCHER_TYPE = { SHIPPING: "SHIPPING", ORDER_DISCOUNT: "ORDER_DISCOUNT" };
export const VOUCHER_TYPE_LABEL = {
  SHIPPING: "PHÍ SHIP",
  ORDER_DISCOUNT: "GIẢM GIÁ",
};
export const DISCOUNT_KIND = { FIXED: "FIXED", PERCENT: "PERCENT" };
export const VOUCHER_STATUS = { UNUSED: "UNUSED", USED: "USED", EXPIRED: "EXPIRED" };
export const VOUCHER_TABS = [
  { key: VOUCHER_STATUS.UNUSED, label: "Chưa dùng" },
  { key: VOUCHER_STATUS.USED, label: "Đã dùng" },
  { key: VOUCHER_STATUS.EXPIRED, label: "Hết hạn" },
];

export const MEMBERSHIP_LIMITS = {
  EXPIRING_SOON_DAYS: 3, // ≤ 3 ngày: gói / mã hiện cảnh báo "sắp hết hạn" (khớp BE VOUCHER_EXPIRING_SOON_DAYS)
  POLL_MS: 3000, // MoMo/VNPay: hỏi lại /memberships/me sau khi quay về app
  POLL_WINDOW_MS: 60 * 1000,
};
