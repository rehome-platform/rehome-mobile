import dayjs from "dayjs";

// Tiền Member nhận = giá × (1 − hoa hồng), làm tròn xuống đồng. rate dạng 0.1
export const calcPayout = (price, rate) => Math.floor(price * (1 - rate));

// 0.1 → "10%"
export const formatRate = (rate) => `${Math.round(rate * 100)}%`;

// "Còn X ngày" tính theo ngày lịch (không theo giờ). Âm = đã quá hạn
export const daysLeft = (deadline) =>
  dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day");
