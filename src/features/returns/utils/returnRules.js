import dayjs from "dayjs";
import { ORDER_STATUS } from "@/constants/order";
import { RETURN_REASONS, RETURN_STATUS as R } from "@/constants/returns";
import { returnDeadlineOf } from "@/features/orders/utils/orderRules";

// MỌI điều kiện của trả hàng đặt ở đây. Màn hình chỉ gọi hàm.

// BR-11 nút "Trả hàng": chỉ khi đơn ĐÃ GIAO mà chưa hoàn thành, còn hạn, chưa có yêu cầu nào.
// BE chặn đơn COMPLETED (409 ORDER_NOT_RETURNABLE): hoàn thành = đã chuyển tiền cho người ký gửi
export const canRequestReturn = (order, now = dayjs()) =>
  order.status === ORDER_STATUS.DELIVERED &&
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

// Member cần làm gì đó: bàn giao GHN, hoặc chọn cách nhận lại hàng không hợp lệ
export const needsAction = (r) =>
  r.status === R.APPROVED || (r.status === R.INVALID && !r.invalidReturnChoice);

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
