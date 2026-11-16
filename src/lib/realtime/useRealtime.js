import { useEffect } from "react";
import { AppState } from "react-native";
import { MOCK } from "@/config/env";
import { queryClient } from "@/lib/query/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { startSocket, stopSocket, subscribe, useSocketStore } from "./socket";

// Gắn ở layout gốc: đăng nhập → mở socket; đăng xuất → đóng. App xuống nền → đóng (đỡ pin, BE push lo phần đó),
// mở lại app → kết nối lại. Nhận thông báo mới ở /user/queue/notifications (BE định tuyến theo JWT lúc CONNECT)
export function useRealtime() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");

  useEffect(() => {
    if (!isAuthed || (MOCK.chat && MOCK.notifications)) {
      stopSocket();
      return;
    }
    startSocket();

    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") startSocket();
      else if (s === "background") stopSocket();
    });

    // Thông báo mới: làm mới chuông + danh sách, báo nhanh tiêu đề
    const offNotifications = subscribe("/user/queue/notifications", (n) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (n?.title) showToast(n.title);
    });

    // (Kết nối lại) sau lúc mất mạng / nền: có thể đã lỡ tin → tải lại những gì đang hiện trên màn
    const offConnected = useSocketStore.subscribe((s, prev) => {
      if (s.connected && !prev.connected) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["chat"] });
      }
    });

    return () => {
      appState.remove();
      offNotifications();
      offConnected();
      stopSocket();
    };
  }, [isAuthed]);
}
