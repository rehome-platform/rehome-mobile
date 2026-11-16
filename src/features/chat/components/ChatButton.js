import { router } from "expo-router";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { useConversations } from "../hooks/useChat";
import { unreadTotal } from "../utils/chatRules";

// Icon tin nhắn + số hội thoại chưa đọc ở header các tab Member (như Shopee: cạnh giỏ hàng).
// Guest bấm → hỏi đăng nhập rồi mở lại hộp thư
export function ChatButton() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const chats = useConversations({ poll: true }); // hỏi lại 30 giây/lần, chưa có realtime
  const n = isAuthed ? unreadTotal(chats.data) : 0;

  const onPress = () =>
    isAuthed
      ? router.push("/messages")
      : askLogin(
          "/messages",
          "Đăng nhập để nhắn tin",
          "Đăng nhập để nhắn với địa điểm ký gửi và tổ chức.",
        );

  return (
    <HeaderIconButton
      icon="chatbubbles-outline"
      label="Tin nhắn, hội thoại chưa đọc"
      badge={n}
      onPress={onPress}
    />
  );
}
