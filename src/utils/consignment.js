import dayjs from "dayjs";
import {
  END_OF_TERM_DECISION,
  PRODUCT_STATUS,
  PRODUCT_VIEW,
} from "@/constants/consignment";
import { DEGRADED_CHOICE, WITHDRAWAL_STATUS } from "@/constants/withdrawal";

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
  // Đang chờ đến lấy hàng rút: xét TRƯỚC status — BE đổi món sang WITHDRAWN ngay khi gửi yêu cầu (gỡ khỏi sàn)
  if (p.activeWithdrawalId) return PRODUCT_VIEW.WITHDRAWING;
  if (p.status === PRODUCT_STATUS.RESERVED) return PRODUCT_VIEW.HAS_ORDER;
  // Quyết định cuối kỳ áp dụng cho món đang bán HOẶC đã gỡ khỏi sàn chờ quyết định (WAREHOUSE — BE 11/11:
  // hết kỳ cuối thì món gỡ khỏi sàn). Trước đây xét "khác ON_SALE → kết thúc" TRƯỚC nên WAREHOUSE hiện nhầm "Đã kết thúc"
  if (
    p.status !== PRODUCT_STATUS.ON_SALE &&
    p.status !== PRODUCT_STATUS.WAREHOUSE
  )
    return PRODUCT_VIEW.ENDED;
  const decision = p.endOfTermDecision;
  if (decision?.decision === END_OF_TERM_DECISION.TAKE_BACK)
    return PRODUCT_VIEW.PICKUP;
  if (decision?.decision === END_OF_TERM_DECISION.RE_CONSIGN)
    return PRODUCT_VIEW.REPRICING;
  if (decision && decision.decision == null)
    return PRODUCT_VIEW.AWAITING_DECISION;
  // WAREHOUSE mà BE chưa gắn quyết định / ca xuống cấp → không phải đang bán (nhãn "Đã gỡ khỏi sàn")
  if (p.status === PRODUCT_STATUS.WAREHOUSE) return PRODUCT_VIEW.ENDED;
  return PRODUCT_VIEW.SELLING;
}

// Quyên góp món ký gửi (đặc tả gửi BE 11/11): được quyên góp ở trường hợp nào → mã trường hợp, không được → null.
// ON_SALE: đang bán, chưa có đơn · END_OF_TERM: hết kỳ cuối, chưa chọn · WITHDRAWAL: rút hàng ĐÃ DUYỆT, chờ đến lấy
// (chờ duyệt thì chưa) · TAKE_BACK: đã chọn nhận lại cuối kỳ · DEGRADED: hàng xuống cấp, đã chọn nhận lại kèm đền
export const DONATE_CASE = {
  ON_SALE: "ON_SALE",
  END_OF_TERM: "END_OF_TERM",
  WITHDRAWAL: "WITHDRAWAL",
  TAKE_BACK: "TAKE_BACK",
  DEGRADED: "DEGRADED",
};
export function donateCaseOf(p) {
  const view = getProductView(p);
  if (view === PRODUCT_VIEW.SELLING) return DONATE_CASE.ON_SALE;
  if (view === PRODUCT_VIEW.AWAITING_DECISION) return DONATE_CASE.END_OF_TERM;
  if (
    view === PRODUCT_VIEW.WITHDRAWING &&
    p.withdrawalStatus === WITHDRAWAL_STATUS.PENDING_PICKUP
  )
    return DONATE_CASE.WITHDRAWAL;
  if (view === PRODUCT_VIEW.PICKUP)
    return p.degradedCase?.choice === DEGRADED_CHOICE.PARTIAL_WITH_ITEM_BACK
      ? DONATE_CASE.DEGRADED
      : DONATE_CASE.TAKE_BACK;
  return null;
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
