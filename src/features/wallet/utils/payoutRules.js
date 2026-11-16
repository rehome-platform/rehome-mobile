import { formatVnd } from "@/utils/money";

// Kiểm số tiền rút trên app (chặn sớm). BE vẫn là bên quyết định cuối (409 có code)
export function validatePayoutAmount(
  amount,
  { available, minPayout, usedToday, maxPerDay },
) {
  if (amount == null) return "Nhập số tiền muốn rút";
  if (amount < minPayout)
    return `Số tiền rút tối thiểu là ${formatVnd(minPayout)}`;
  if (amount > available) {
    return `Vượt quá số dư khả dụng. Mức cao nhất bạn rút được bây giờ là ${formatVnd(available)}.`;
  }
  if (usedToday != null && usedToday >= maxPerDay) {
    return `Bạn đã rút ${maxPerDay} lần hôm nay. Thử lại vào ngày mai.`;
  }
  return null;
}
