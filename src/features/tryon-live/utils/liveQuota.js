import dayjs from "dayjs";
import { TIER_SHORT } from "@/constants/membership";

// Đọc GET /tryon/live/quota (BE theo gói thành viên):
// { tier, tierName, limitPerDay, usedToday, remainingToday, limitPerMonth, usedThisMonth, remainingThisMonth,
//   maxSeconds, canStart, upsellTier }. limit null = không giới hạn.
// Bản chốt 14/11: real-time tính theo THÁNG (Admin để trống lượt/ngày) — nhưng đọc cả hai để Admin đặt kiểu nào cũng đúng.
// Trần tháng ưu tiên hiển thị; có cả trần ngày thì lấy chỗ còn ít lượt hơn.
export function liveQuotaView(q) {
  if (!q) return null;
  const month =
    q.limitPerMonth != null
      ? {
          period: "tháng này",
          unit: "tháng",
          limit: q.limitPerMonth,
          remaining: q.remainingThisMonth ?? Math.max(0, q.limitPerMonth - (q.usedThisMonth ?? 0)),
          resetText: `Lượt mới vào ngày ${dayjs().add(1, "month").startOf("month").format("DD/MM")}.`,
        }
      : null;
  const day =
    q.limitPerDay != null
      ? {
          period: "hôm nay",
          unit: "ngày",
          limit: q.limitPerDay,
          remaining: q.remainingToday ?? Math.max(0, q.limitPerDay - (q.usedToday ?? 0)),
          resetText: "Lượt mới vào 00:00 ngày mai.",
        }
      : null;
  // Chỗ đang chặn trước (hết trước) quyết định câu hiển thị
  const binding =
    month && day ? (day.remaining < month.remaining ? day : month) : month ?? day;

  return {
    canStart: q.canStart ?? (binding ? binding.remaining > 0 : true),
    unlimited: !binding,
    ...(binding ?? {}),
    maxSeconds: q.maxSeconds,
    tierName: q.tierName,
    upsellTier: q.upsellTier ?? null,
    upsellLabel: q.upsellTier ? TIER_SHORT[q.upsellTier] ?? q.upsellTier : null,
  };
}

// "Còn 3/4 lượt tháng này" · "Không giới hạn lượt"
export const remainingText = (v) =>
  !v || v.unlimited
    ? "Không giới hạn lượt"
    : `Còn ${v.remaining}/${v.limit} lượt ${v.period}`;
