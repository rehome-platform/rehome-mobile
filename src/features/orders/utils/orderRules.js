import dayjs from "dayjs";
import { ORDER_STATUS as S } from "@/constants/order";
import { toDate } from "./time";

// MỌI điều kiện hiện nút của đơn đặt ở đây (giống getProductView Phase 2). Màn hình chỉ gọi hàm.

export const secondsUntil = (v) =>
  v ? Math.max(0, toDate(v).diff(dayjs(), "second")) : 0;

export const canPay = (o) =>
  o.status === S.PENDING_PAYMENT && secondsUntil(o.paymentDeadline) > 0;
export const canCancel = (o) => o.status === S.PAID; // API 65: chỉ khi kho chưa đóng gói
export const canConfirm = (o) => o.status === S.DELIVERED; // [CHỜ BE] có cho SHIPPING không (câu 9)
export const canRate = (o) =>
  o.status === S.COMPLETED && o.serviceRating == null; // API 67
export const canTrack = (o) =>
  !!o.ghnTrackingCode &&
  [S.SHIPPING, S.DELIVERED, S.COMPLETED].includes(o.status);

// Đơn huỷ có hoàn tiền (đã từng trả) — đơn huỷ vì hết hạn thanh toán thì không
export const wasRefunded = (o) =>
  o.status === S.CANCELLED && (o.refundAmount ?? 0) > 0;

// Phase 5 dùng: hạn trả hàng tính theo MỐC giao, không theo trạng thái. [CHỜ BE] số ngày từ cấu hình
export const returnDeadlineOf = (o, days = 3) =>
  o.deliveredAt ? toDate(o.deliveredAt).add(days, "day") : null;

// Chỉ số bước ĐÃ XONG cuối cùng trên ORDER_STEPS (bước kế = đang diễn ra). Đã huỷ → -1 (không vẽ thanh bước)
export const orderStepOf = (o) =>
  ({
    PENDING_PAYMENT: 0, // xong Đặt hàng → đang chờ Thanh toán
    PAID: 1, // xong Thanh toán → chờ Kho đóng gói
    PACKING: 1, // đang Kho đóng gói
    SHIPPING: 2, // xong đóng gói → đang giao
    DELIVERED: 3, // đã giao tới nơi → chờ Hoàn thành
    COMPLETED: 4,
  })[o.status] ?? -1;

// "2 ngày 7 giờ" / "5 giờ" / "30 phút" — thời gian còn lại tới mốc (tự hoàn thành…)
export function formatTimeLeft(v) {
  const s = secondsUntil(v);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return h > 0 ? `${d} ngày ${h} giờ` : `${d} ngày`;
  if (h > 0) return `${h} giờ`;
  return `${Math.max(1, Math.floor(s / 60))} phút`;
}
