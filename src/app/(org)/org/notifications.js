import NotificationListScreen from "@/features/notifications/screens/NotificationListScreen";

// OM-03 · Thông báo của tổ chức (dùng chung màn PR-05). Mở từ chuông ở tab Hồ sơ
export default function OrgNotifications() {
  return <NotificationListScreen viewer="org" backHref="/org/profile" />;
}
