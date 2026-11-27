import dayjs from "dayjs";
import { ORDER_STATUS } from "@/constants/order";
import {
  RETURN_REASONS,
  RETURN_STATUS as R,
  SHIP_BACK_STATUS as SB,
} from "@/constants/returns";
import { returnDeadlineOf } from "@/features/orders/utils/orderRules";

// MỌI điều kiện của trả hàng đặt ở đây. Màn hình chỉ gọi hàm.

// BR-11 nút "Trả hàng": đơn Đã giao hoặc Hoàn thành, còn hạn 3 ngày kể từ lúc GHN báo giao,
// chưa có yêu cầu nào. Đã bấm "Đã nhận hàng" vẫn trả được: BE giữ tiền người ký gửi tới hết hạn
const RETURNABLE = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED];
export const canRequestReturn = (order, now = dayjs()) =>
  RETURNABLE.includes(order.status) &&
  !order.returnRequestId && // [CHỜ BE câu 3] field liên kết
  !!returnDeadlineOf(order)?.isAfter(now);

// RT-01 Quá hạn: đã giao nhưng hết cửa sổ trả
export const isReturnWindowOver = (order, now = dayjs()) =>
  !!order.deliveredAt && !returnDeadlineOf(order).isAfter(now);

// Chỉ số bước ĐÃ XONG cuối cùng trên RETURN_STEPS (bước kế = đang diễn ra). Đã huỷ → -1 (vẽ riêng)
export const returnStepOf = (r) =>
  ({
    PENDING: 0, // xong Gửi → kho đang xem
    APPROVED: 1, // kho đã duyệt → chờ bàn giao
    SHIPPED_BACK: 2, // đã bàn giao → đang về kho
    INSPECTING: 2, // hàng về, đang kiểm
    VALID: 4,
    INVALID: 4,
    LOST: 4,
  })[r.status] ?? -1;

// ReHome gửi lại (đặc tả 27/11): đã trả phí / đang gửi → hàng đã vào luồng gửi, hạn nhận lại 7 ngày thôi áp dụng
export const shipBackInProgress = (r) =>
  r.status === R.INVALID &&
  [SB.PAID, SB.SHIPPING].includes(r.shipBackStatus);
export const shipBackAwaitingPayment = (r) =>
  r.status === R.INVALID && r.shipBackStatus === SB.AWAITING_PAYMENT;

// Hàng trả không hợp lệ đã xong việc: đã nhận lại tại quầy (pickedUpAt — [CHỜ BE] trả field này),
// GHN đã giao bản gửi lại, hoặc quá hạn nhận lại (hàng vô chủ) → không còn nút chọn cách nhận / mã Member
export const invalidPickedUp = (r) =>
  r.status === R.INVALID &&
  (!!r.pickedUpAt || r.shipBackStatus === SB.DELIVERED);
export const invalidPickupExpired = (r) =>
  r.status === R.INVALID &&
  !invalidPickedUp(r) &&
  !shipBackInProgress(r) &&
  !!r.pickupDeadline &&
  dayjs(r.pickupDeadline).isBefore(dayjs());
const invalidOpen = (r) =>
  r.status === R.INVALID && !invalidPickedUp(r) && !invalidPickupExpired(r);

// Member cần làm gì đó: bàn giao GHN, chọn cách nhận lại hàng không hợp lệ (còn hạn), hoặc trả phí gửi lại
export const needsAction = (r) =>
  r.status === R.APPROVED ||
  (invalidOpen(r) && (!r.invalidReturnChoice || shipBackAwaitingPayment(r)));

export const wasRefunded = (r) => [R.VALID, R.LOST].includes(r.status);

// Gửi BE một chuỗi reason = "<lựa chọn>: <mô tả>" (API 79 chỉ có reason)
export const buildReasonText = (reasonKey, detail) => {
  const label = RETURN_REASONS.find((r) => r.key === reasonKey)?.label ?? "";
  return detail?.trim() ? `${label}: ${detail.trim()}` : label;
};

// Tách ngược để RT-02 hiện "Lý do bạn đã gửi" (đậm) + mô tả
export const splitReasonText = (text = "") => {
  const hit = RETURN_REASONS.find((r) => text.startsWith(r.label));
  if (!hit) return { title: null, detail: text };
  return {
    title: hit.label,
    detail: text.slice(hit.label.length).replace(/^:\s*/, ""),
  };
};
