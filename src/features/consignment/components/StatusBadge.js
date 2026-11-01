import { StatusChip } from "@/components/ui/StatusChip";
import { FORM_STATUS, FORM_STATUS_LABEL } from "@/constants/consignment";

// Trạng thái yêu cầu ký gửi. Đã duyệt = CẦN BẠN mang đồ tới → warning; ReHome đang duyệt / kiểm định → info
const TONE = {
  [FORM_STATUS.PENDING]: "info",
  [FORM_STATUS.APPROVED]: "warning",
  [FORM_STATUS.INSPECTING]: "info",
  [FORM_STATUS.REJECTED]: "danger",
  [FORM_STATUS.EXPIRED]: "neutral",
  [FORM_STATUS.CANCELLED]: "neutral",
};

// form: BE giữ INSPECTING cả sau khi lập biên nhận → có biên nhận chưa xác nhận thì hiện "Chờ xác nhận biên nhận"
// (CẦN BẠN làm → warning) thay vì "Đang kiểm định"
export function StatusBadge({ form }) {
  if (form.receiptId && !form.receiptConfirmed)
    return <StatusChip label="Chờ xác nhận biên nhận" tone="warning" />;
  if (form.receiptConfirmed)
    return <StatusChip label="Đã nhận hàng" tone="success" />;
  return (
    <StatusChip
      label={FORM_STATUS_LABEL[form.status] ?? form.status}
      tone={TONE[form.status]}
    />
  );
}
