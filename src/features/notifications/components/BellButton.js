import { router } from "expo-router";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { useUnreadNotifications } from "../hooks/useNotifications";

// Chuông + số thông báo chưa đọc ở header (các tab Member và tổ chức). Guest bấm → hỏi đăng nhập
export function BellButton({ href = "/notifications" }) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const unread = useUnreadNotifications();
  const n = isAuthed ? (unread.data ?? 0) : 0;

  const onPress = () =>
    isAuthed
      ? router.push(href)
      : askLogin(
          href,
          "Đăng nhập để xem thông báo",
          "Đăng nhập để nhận thông báo về đơn hàng, ký gửi và bình luận.",
        );

  return (
    <HeaderIconButton
      icon="notifications-outline"
      label="Thông báo chưa đọc"
      badge={n}
      onPress={onPress}
    />
  );
}
