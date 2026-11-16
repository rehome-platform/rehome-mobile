import { StatusChip } from "@/components/ui/StatusChip";
import { ORDER_STATUS as S, ORDER_STATUS_LABEL } from "@/constants/order";

// Cần Member làm (trả tiền, xác nhận đã nhận) → warning; ReHome / GHN đang xử lý → info;
// xong → success; huỷ / đã trả hàng → neutral
const TONE = {
  [S.PENDING_PAYMENT]: "warning",
  [S.PAID]: "info",
  [S.PACKING]: "info",
  [S.SHIPPING]: "info",
  [S.DELIVERED]: "warning",
  [S.COMPLETED]: "success",
  [S.RETURNED]: "neutral",
  [S.CANCELLED]: "neutral",
};

export function OrderStatusBadge({ status }) {
  return (
    <StatusChip
      label={ORDER_STATUS_LABEL[status] ?? status}
      tone={TONE[status]}
    />
  );
}
