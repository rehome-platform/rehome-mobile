import dayjs from "dayjs";
import {
  BILLING_CYCLE,
  DISCOUNT_KIND,
  MEMBERSHIP_LIMITS,
  SUBSCRIPTION_STATUS,
  TIER,
  TIER_RANK,
  VOUCHER_TYPE,
} from "@/constants/membership";
import { formatNumber, formatVnd } from "@/utils/money";

// Đang có gói trả phí còn hiệu lực (FREE / chưa mua → false)
export const hasPaidPlan = (me) =>
  !!me &&
  me.tier !== TIER.FREE &&
  me.status === SUBSCRIPTION_STATUS.ACTIVE;

export const isExpiringSoon = (me) =>
  hasPaidPlan(me) &&
  me.daysRemaining != null &&
  me.daysRemaining <= MEMBERSHIP_LIMITS.EXPIRING_SOON_DAYS;

// Giá theo chu kỳ (null = gói không bán theo năm)
export const priceOf = (plan, cycle) =>
  cycle === BILLING_CYCLE.YEARLY ? plan.pricePerYear : plan.pricePerMonth;

// "Tiết kiệm đến 17%" — lấy % lớn nhất BE tính sẵn (yearlySavingPercent), không tự tính
export function maxYearlySaving(plans = []) {
  const max = Math.max(0, ...plans.map((p) => Number(p.yearlySavingPercent) || 0));
  return Math.round(max);
}

// Nút trên thẻ gói theo gói đang dùng: "Gia hạn" (cùng hạng) · "Nâng cấp" (hạng cao hơn) · "Chuyển gói" (thấp hơn)
export function planAction(plan, me) {
  if (!hasPaidPlan(me)) return { kind: "BUY", label: "Chọn gói" };
  if (plan.tier === me.tier) return { kind: "RENEW", label: "Gia hạn" };
  return TIER_RANK[plan.tier] > TIER_RANK[me.tier]
    ? { kind: "UPGRADE", label: "Nâng cấp" }
    : { kind: "SWITCH", label: "Chuyển gói" };
}

// Ngày hết hạn sau khi mua (chỉ để HIỂN THỊ trước — BE quyết định thật):
// cùng hạng còn hạn → cộng dồn vào hạn hiện tại (quy tắc 11); khác hạng / chưa có → tính từ hôm nay
export function expectedExpiry(plan, cycle, me) {
  const renew = hasPaidPlan(me) && me.tier === plan.tier && me.expiresAt;
  const from = renew ? dayjs(me.expiresAt) : dayjs();
  return from.add(1, cycle === BILLING_CYCLE.YEARLY ? "year" : "month");
}

// Một dòng hạn mức thử đồ: tháng ưu tiên (real-time chốt theo tháng), không có thì ngày, cả hai null = không giới hạn.
// → { label, used, limit (null = không giới hạn), note }
export function tryonLimitLine(q, name) {
  if (!q) return null;
  if (q.limitPerMonth != null)
    return {
      label: `${name} tháng này`,
      used: q.usedThisMonth ?? 0,
      limit: q.limitPerMonth,
      note: "Lượt mới vào ngày 1 hằng tháng",
    };
  if (q.limitPerDay != null)
    return {
      label: `${name} hôm nay`,
      used: q.usedToday ?? 0,
      limit: q.limitPerDay,
      note: "Làm mới lúc 00:00 mỗi ngày",
    };
  return { label: name, used: null, limit: null, note: null };
}

// Danh sách quyền lợi của một gói — dựng TỪ DỮ LIỆU BE (Admin đổi số là app tự đúng)
export function benefitLines(plan) {
  const b = plan.benefits ?? {};
  const lines = [];

  // Thử đồ real-time: theo tháng (bản chốt) → theo ngày → không giới hạn
  const sec = b.liveTryonMaxSeconds ? ` · ${b.liveTryonMaxSeconds} giây/lượt` : "";
  if (b.liveTryonPerMonth != null)
    lines.push(`${b.liveTryonPerMonth} lượt thử đồ real-time/tháng${sec}`);
  else if (b.liveTryonPerDay != null)
    lines.push(`${b.liveTryonPerDay} lượt thử đồ real-time/ngày${sec}`);
  else lines.push(`Thử đồ real-time không giới hạn${sec}`);

  if (b.aiTryonPerDay != null)
    lines.push(`${b.aiTryonPerDay} lượt phối đồ AI/ngày`);
  else if (b.aiTryonPerMonth == null) lines.push("Phối đồ AI không giới hạn");

  for (const v of plan.vouchers ?? []) {
    if (v.quantityPerMonth > 0)
      lines.push(`${v.quantityPerMonth} mã ${lowerFirst(v.name)}/tháng`);
  }

  if (b.featuredListing)
    lines.push("Sản phẩm nổi bật cho toàn bộ hàng đang bán trên sàn");
  if (b.maxPendingConsignmentForms != null)
    lines.push(`Tối đa ${b.maxPendingConsignmentForms} form ký gửi chờ duyệt`);
  return lines;
}

const lowerFirst = (s = "") => (s ? s[0].toLowerCase() + s.slice(1) : s);

// Ô trái của thẻ voucher: "15K" / "10%"
export function voucherHeadline(v) {
  if (v.discountKind === DISCOUNT_KIND.PERCENT)
    return `${Math.round(Number(v.discountValue) * 100)}%`;
  const value = Number(v.discountValue) || 0;
  return value >= 1000 && value % 1000 === 0
    ? `${formatNumber(value / 1000)}K`
    : formatNumber(value);
}

// Điều kiện + mức trần: "Đơn từ 200.000 đ · tối đa 50.000 đ"
export function voucherCondition(v) {
  const parts = [
    Number(v.minOrderAmount) > 0
      ? `Đơn từ ${formatVnd(v.minOrderAmount)}`
      : "Mọi giá trị đơn",
  ];
  if (v.discountKind === DISCOUNT_KIND.PERCENT && v.maxDiscountAmount != null)
    parts.push(`tối đa ${formatVnd(v.maxDiscountAmount)}`);
  if (v.type === VOUCHER_TYPE.SHIPPING)
    parts.push("không vượt quá phí ship thật");
  return parts.join(" · ");
}
