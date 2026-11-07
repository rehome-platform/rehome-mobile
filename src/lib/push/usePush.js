import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/roles";
import {
  configurePushHandler,
  listenPushTap,
  listenTokenRefresh,
  registerPush,
} from "./push";

// Bấm thông báo đẩy → màn cần mở.
// Tin nhắn (type CHAT_MESSAGE, có conversationId) → phòng chat. Thông báo thường → màn chi tiết thông báo
// (3.13.4: tự đánh dấu đã đọc + nút mở bản ghi liên quan theo targetType / targetId)
function hrefOf(d, isOrg) {
  if (d.type === "CHAT_MESSAGE" && d.conversationId)
    return isOrg
      ? `/org/my-messages/${d.conversationId}`
      : `/messages/${d.conversationId}`;
  if (d.notificationId)
    return isOrg
      ? `/org/notification/${d.notificationId}`
      : `/notification/${d.notificationId}`;
  return null;
}

// Gắn ở layout gốc. ready = Stack đã dựng xong VÀ đã ở đúng nhóm màn (tổ chức phải vào (org) trước,
// nếu không lệnh router.replace("/org") của layout sẽ đè lên màn vừa mở từ thông báo)
export function usePush(ready) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const isOrg = useAuthStore((s) => s.user?.role === ROLES.ORGANIZATION);
  const [pending, setPending] = useState(null); // dữ liệu thông báo vừa bấm, chờ app sẵn sàng mới mở

  useEffect(() => {
    configurePushHandler();
    return listenPushTap(setPending);
  }, []);

  // Đăng nhập / mở lại app khi đã đăng nhập → xin quyền + gửi token FCM cho BE
  useEffect(() => {
    if (!isAuthed) return;
    registerPush();
    return listenTokenRefresh();
  }, [isAuthed]);

  useEffect(() => {
    if (!pending || !ready || !isAuthed) return;
    const href = hrefOf(pending, isOrg);
    setPending(null);
    if (href) router.push(href);
  }, [pending, ready, isAuthed, isOrg]);
}
