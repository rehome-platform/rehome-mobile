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

export function StatusBadge({ status }) {
  return (
    <StatusChip
      label={FORM_STATUS_LABEL[status] ?? status}
      tone={TONE[status]}
    />
  );
}
