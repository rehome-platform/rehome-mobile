import dayjs from "dayjs";
import {
  END_OF_TERM_DECISION,
  PRODUCT_STATUS,
  PRODUCT_VIEW,
} from "@/constants/consignment";
import { DEGRADED_CHOICE } from "@/constants/withdrawal";

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
// Quy đổi dữ liệu sản phẩm → trạng thái hiển thị. BE chưa chốt cách báo "chờ xử lý cuối kỳ"
// → mọi chỗ khác chỉ gọi hàm này; BE chốt thì chỉ sửa ở đây [CHỜ BE]
export function getProductView(p) {
  // Phase 5: ca hàng xuống cấp [CHỜ BE câu 13] tên field. Xét trước status vì món đã bán rồi bị trả về
  const dc = p.degradedCase;
  if (dc && !dc.choice) return PRODUCT_VIEW.DEGRADED_DECISION;
  if (dc?.choice === DEGRADED_CHOICE.PARTIAL_WITH_ITEM_BACK)
    return PRODUCT_VIEW.PICKUP; // nhận lại món hỏng — dùng chung màn "Chờ nhận lại"
  if (p.status === PRODUCT_STATUS.RESERVED) return PRODUCT_VIEW.HAS_ORDER;
  if (p.status !== PRODUCT_STATUS.ON_SALE) return PRODUCT_VIEW.ENDED;
  if (p.activeWithdrawalId) return PRODUCT_VIEW.WITHDRAWING; // Phase 5 [CHỜ BE câu 13] field liên kết
  const decision = p.endOfTermDecision;
  if (decision?.decision === END_OF_TERM_DECISION.TAKE_BACK)
    return PRODUCT_VIEW.PICKUP;
  if (decision?.decision === END_OF_TERM_DECISION.RE_CONSIGN)
    return PRODUCT_VIEW.REPRICING;
  if (decision && decision.decision == null)
    return PRODUCT_VIEW.AWAITING_DECISION;
  return PRODUCT_VIEW.SELLING;
}

// Thứ tự trên danh sách: việc cần Member làm lên đầu
export const PRODUCT_VIEW_ORDER = [
  PRODUCT_VIEW.DEGRADED_DECISION,
  PRODUCT_VIEW.AWAITING_DECISION,
  PRODUCT_VIEW.REPRICING,
  PRODUCT_VIEW.PICKUP,
  PRODUCT_VIEW.WITHDRAWING,
  PRODUCT_VIEW.SELLING,
  PRODUCT_VIEW.HAS_ORDER,
  PRODUCT_VIEW.ENDED,
];

// Ngày thứ mấy trên sàn, tổng ngày, còn bao nhiêu ngày của kỳ hiện tại
// Ngày n = (kỳ − 1) × số ngày một kỳ + số ngày từ đầu kỳ này + 1
export function productTiming(p) {
  const total = totalTermDays(p);
  const sinceTermStart = dayjs()
    .startOf("day")
    .diff(dayjs(p.termStartedAt).startOf("day"), "day");
  const dayNumber = Math.min(
    (p.currentTerm - 1) * p.termLengthDays + sinceTermStart + 1,
    total,
  );
  return {
    dayNumber,
    totalDays: total,
    totalTerms: p.maxRenewals + 1,
    isLastTerm: p.currentTerm >= p.maxRenewals + 1,
    termDaysLeft: daysLeft(p.endOfTermDeadline),
  };
}

// Tỷ lệ hoa hồng của kỳ đang chạy (0.1 / 0.15 / 0.2)
export const currentRate = (p) => commissionRates(p)[p.currentTerm - 1];
