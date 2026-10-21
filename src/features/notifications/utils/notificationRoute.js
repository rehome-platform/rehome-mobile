import { NOTIFICATION_TARGET as T } from "@/constants/notification";

// MỘT chỗ duy nhất quyết định bấm thông báo mở màn nào (PHASE6_GUIDE 0.5 A19).
// viewer = "member" | "org" (phía tổ chức thêm đích riêng ở nhánh 10). Không có đích → null (chỉ đánh dấu đã đọc)
export function notificationRoute(n, viewer = "member") {
  if (!n?.targetType) return null;
  const id = n.targetId;
  if (viewer === "org") {
    switch (n.targetType) {
      case T.CAMPAIGN:
        return `/org/campaigns/${id}`;
      case T.POST:
        return `/org/posts/${id}/comments`;
      default:
        return null;
    }
  }
  switch (n.targetType) {
    case T.ORDER:
      return `/orders/${id}`;
    case T.RETURN_REQUEST:
      return `/returns/${id}`;
    case T.WITHDRAWAL:
      return `/withdrawals/${id}`;
    case T.PRODUCT:
      return `/my-products/${id}`;
    case T.CONSIGNMENT_FORM:
      return `/consign-forms/${id}`;
    case T.PAYOUT:
      return `/wallet/payouts/${id}`;
    case T.WALLET:
      return "/wallet";
    case T.CAMPAIGN:
      return `/campaigns/${id}`;
    case T.POST:
      return `/posts/${id}`;
    default:
      return null;
  }
}
