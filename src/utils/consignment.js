import dayjs from "dayjs";

// Tiền Member nhận = giá × (1 − hoa hồng), làm tròn xuống đồng. rate dạng 0.1
export const calcPayout = (price, rate) => Math.floor(price * (1 - rate));

// 0.1 → "10%"
export const formatRate = (rate) => `${Math.round(rate * 100)}%`;

// "Còn X ngày" tính theo ngày lịch (không theo giờ). Âm = đã quá hạn
export const daysLeft = (deadline) =>
  dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day");
// Tổng số ngày ký gửi theo biên nhận: 30 × (2 lần gia hạn + 1) = 90
export const totalTermDays = (receipt) =>
  receipt.termLengthDays * (receipt.maxRenewals + 1);

// [0.1, 0.15, 0.2] — tỷ lệ hoa hồng từng kỳ, lấy từ biên nhận
export const commissionRates = (receipt) =>
  [
    receipt.commissionRateTerm1,
    receipt.commissionRateTerm2,
    receipt.commissionRateTerm3,
  ].filter((r) => r != null);
