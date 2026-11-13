import {
  NOTIFICATION_TARGET as T,
  NOTIFICATION_TYPE as TYPE,
} from "@/constants/notification";

// MỘT chỗ duy nhất quyết định bấm thông báo mở màn nào (PHASE6_GUIDE 0.5 A19).
// viewer = "member" | "org" (phía tổ chức thêm đích riêng ở nhánh 10). Không có đích → null (chỉ đánh dấu đã đọc)
export function notificationRoute(n, viewer = "member") {
  // Gói thành viên / voucher: BE không gắn targetType → mở theo loại thông báo
  if (viewer === "member" && n?.type === TYPE.MEMBERSHIP_EVENT)
    return "/membership/me";
  if (viewer === "member" && n?.type === TYPE.VOUCHER_ISSUED) return "/vouchers";
  if (!n?.targetType) return null;
  const id = n.targetId;
  // Màn con của tổ chức nằm ở my-* (tránh trùng URL với tab /org/campaigns, /org/posts…)
  if (viewer === "org") {
    switch (n.targetType) {
      case T.CAMPAIGN:
        // Lượt quyên góp mới (kèm kho) → thẳng màn chờ lấy của kho đó (OC-07)
        return n.warehouseId
          ? `/org/my-campaigns/${id}/donations?warehouseId=${n.warehouseId}`
          : `/org/my-campaigns/${id}`;
      case T.POST:
        return `/org/my-posts/${id}/comments`;
      case T.ORGANIZATION:
        return "/org/profile";
      case T.LEGAL_CHANGE:
        return "/org/my-profile/legal-status";
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
    case T.DEGRADED_ITEM_CASE:
      return `/degraded-cases/${id}`;
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
