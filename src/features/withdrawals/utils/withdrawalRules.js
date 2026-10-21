import dayjs from "dayjs";
import { PRODUCT_VIEW } from "@/constants/consignment";
import {
  commissionRates,
  getProductView,
  productTiming,
} from "@/utils/consignment";

// MỌI điều kiện / con số xem trước của rút hàng đặt ở đây. Màn hình chỉ gọi hàm.

// KG-09 nút "Rút hàng về": chỉ khi đang bán bình thường (không có đơn, không cuối kỳ, chưa có yêu cầu rút)
export const canWithdraw = (p) => getProductView(p) === PRODUCT_VIEW.SELLING;

// Cửa sổ miễn phí: termStartedAt (đầu kỳ đang chạy) + freeWithdrawalWindowDays (biên nhận)
export function freeWindowOf(p, now = dayjs()) {
  const windowDays = p.freeWithdrawalWindowDays ?? 0;
  const start = dayjs(p.termStartedAt);
  const endsAt = start.add(windowDays, "day");
  const isFree = now.isBefore(endsAt);
  return {
    isFree,
    endsAt,
    windowDays,
    dayOfTerm: now.startOf("day").diff(start.startOf("day"), "day") + 1, // "ngày 4 của kỳ 2"
    daysLeft: isFree
      ? Math.max(1, Math.ceil(endsAt.diff(now, "day", true)))
      : 0,
  };
}

// Chỉ để XEM TRƯỚC — số phí thật là feeCharged BE trả ở API 90
export const estimateFee = (p) =>
  freeWindowOf(p).isFree ? 0 : (p.withdrawalFee ?? 0);

// Trừ ví trước, thiếu mới MoMo (PHASE5_GUIDE 0.4 #1)
export const splitFee = (fee, available) => {
  const fromWallet = Math.min(fee, Math.max(0, available ?? 0));
  return { fromWallet, fromMomo: fee - fromWallet };
};

// KG-13 "Có thể chờ để khỏi mất phí" — chỉ khi còn kỳ sau
export function nextFreeWindow(p) {
  const t = productTiming(p);
  if (t.isLastTerm) return null;
  return {
    term: p.currentTerm + 1,
    startsAt: dayjs(p.endOfTermDeadline),
    daysLeft: t.termDaysLeft,
    nextRate: commissionRates(p)[p.currentTerm], // hoa hồng kỳ sau
  };
}
// ---------- Hàng xuống cấp (KG-16) ----------
// Đền đủ = compensationAmount; nhận lại hàng = compensationAmount × tỷ lệ biên nhận, làm tròn xuống đồng
export const degradedAmount = (c, fullChoice) =>
  fullChoice
    ? c.compensationAmount
    : Math.floor(c.compensationAmount * (c.degradedCompensationRate ?? 0));
