import { StatusChip } from "@/components/ui/StatusChip";
import {
  PRODUCT_ENDED_LABEL,
  PRODUCT_VIEW,
  PRODUCT_VIEW_LABEL,
} from "@/constants/consignment";
import { getProductView } from "@/utils/consignment";

// Đang bán → success; có đơn / ReHome đang chốt giá → info;
// CẦN BẠN LÀM (chọn cuối kỳ, đến lấy hàng) → warning; hàng hỏng chờ chọn → danger; kết thúc → neutral
const TONE = {
  [PRODUCT_VIEW.SELLING]: "success",
  [PRODUCT_VIEW.HAS_ORDER]: "info",
  [PRODUCT_VIEW.REPRICING]: "info",
  [PRODUCT_VIEW.AWAITING_DECISION]: "warning",
  [PRODUCT_VIEW.PICKUP]: "warning",
  [PRODUCT_VIEW.WITHDRAWING]: "warning",
  [PRODUCT_VIEW.DEGRADED_DECISION]: "danger",
  [PRODUCT_VIEW.ENDED]: "neutral",
};

export function ProductBadge({ product }) {
  const view = getProductView(product);
  const label =
    view === PRODUCT_VIEW.ENDED
      ? PRODUCT_ENDED_LABEL[product.status]
      : PRODUCT_VIEW_LABEL[view];
  return <StatusChip label={label} tone={TONE[view]} />;
}
