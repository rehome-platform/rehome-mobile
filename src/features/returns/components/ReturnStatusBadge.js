import { StatusChip } from "@/components/ui/StatusChip";
import { RETURN_STATUS as R, RETURN_STATUS_LABEL } from "@/constants/returns";

// Cần Member làm (bàn giao GHN, chọn cách nhận lại) → warning; ReHome đang xử lý → info;
// đã hoàn tiền → success; huỷ → neutral
const TONE = {
  [R.PENDING]: "info",
  [R.APPROVED]: "warning",
  [R.SHIPPED_BACK]: "info",
  [R.INSPECTING]: "info",
  [R.VALID]: "success",
  [R.INVALID]: "danger",
  [R.LOST]: "success",
  [R.CANCELLED]: "neutral",
};

export function ReturnStatusBadge({ status }) {
  return (
    <StatusChip
      label={RETURN_STATUS_LABEL[status] ?? status}
      tone={TONE[status]}
    />
  );
}
