import NotificationDetailScreen from "@/features/notifications/screens/NotificationDetailScreen";

// Chi tiết thông báo của tổ chức (dùng chung màn 3.13.4)
export default function OrgNotificationDetail() {
  return (
    <NotificationDetailScreen viewer="org" backHref="/org/notifications" />
  );
}
