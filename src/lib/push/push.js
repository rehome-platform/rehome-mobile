import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { api } from "@/lib/api/client";

// Thông báo đẩy khi app đã tắt / ở nền (BE gửi qua Firebase Cloud Messaging).
// expo-notifications là thư viện NATIVE: dev build / APK cũ chưa có (import là ném lỗi ngay) → kiểm trước,
// không có thì coi như không có push, app vẫn chạy bình thường (WebSocket lo lúc app đang mở).
// Build mới (có google-services.json) mới nhận push.
let N = null;
if (requireOptionalNativeModule("ExpoPushTokenManager")) {
  try {
    N = require("expo-notifications");
  } catch {
    N = null;
  }
}
export const pushSupported = () => !!N && Platform.OS === "android"; // iOS cần APNs + Firebase iOS — chưa làm

const CHANNEL_ID = "default"; // khớp defaultChannel trong app.config.js (push FCM không ghi kênh → vào kênh này)
let currentToken = null; // token FCM đã đăng ký với BE — để gỡ khi đăng xuất

// Phòng chat đang mở (ChatRoomScreen đặt) → push tin của chính phòng đó không hiện banner
let activeConversationId = null;
export const setActiveConversation = (id) => {
  activeConversationId = id;
};

// Dữ liệu push: BE gửi phần data (type, conversationId | notificationId, targetType, targetId).
// Tuỳ lúc nhận (app mở / nền / tắt) expo đặt ở content.data hoặc trigger.remoteMessage.data → gộp cả hai
export const pushData = (notification) => ({
  ...(notification?.request?.trigger?.remoteMessage?.data ?? {}),
  ...(notification?.request?.content?.data ?? {}),
});

// App ĐANG MỞ mà có push:
// - Tin nhắn: hiện banner trừ khi đang ở đúng phòng đó (danh sách chat chưa có WebSocket → banner báo thay)
// - Thông báo thường: không hiện banner — WebSocket đã hiện toast + chuông nhảy số (tránh báo 2 lần)
export function configurePushHandler() {
  if (!pushSupported()) return;
  N.setNotificationHandler({
    handleNotification: async (notification) => {
      const d = pushData(notification);
      const show =
        d.type === "CHAT_MESSAGE" && d.conversationId !== activeConversationId;
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      };
    },
  });
}

// Đăng nhập xong / mở lại app khi đã đăng nhập: xin quyền (Android 13+), lấy token FCM, gửi BE.
// Người dùng từ chối quyền / máy chưa có Firebase → bỏ qua, không làm phiền
export async function registerPush() {
  if (!pushSupported()) return;
  try {
    // Android 13+: phải có kênh TRƯỚC khi xin quyền thì hộp thoại xin quyền mới hiện
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Tin nhắn và thông báo",
      importance: N.AndroidImportance.HIGH,
    });
    let { status } = await N.getPermissionsAsync();
    if (status !== "granted") ({ status } = await N.requestPermissionsAsync());
    if (status !== "granted") return;

    const { data: token } = await N.getDevicePushTokenAsync(); // Android: token FCM gốc (BE gửi thẳng FCM)
    await sendToken(token);
  } catch {
    // Chưa cấu hình Firebase trong bản build / mất mạng → lần mở app sau thử lại
  }
}

async function sendToken(token) {
  if (!token || token === currentToken) return;
  await api.post("/me/device-tokens", { token, platform: "ANDROID" });
  currentToken = token;
}

// Firebase đổi token (hiếm) → đăng ký lại. Trả hàm huỷ
export function listenTokenRefresh() {
  if (!pushSupported()) return () => {};
  // Expo Go trên Android có sẵn module nhưng đã bỏ push từ SDK 53: addPushTokenListener NÉM LỖI
  // (không chỉ cảnh báo) → bắt lại, coi như không có push; dev build / APK chạy bình thường.
  try {
    const sub = N.addPushTokenListener(({ data }) => {
      sendToken(data).catch(() => {});
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

// Đăng xuất: gỡ token TRƯỚC khi xoá token đăng nhập (API cần access token) → máy này thôi nhận push của tài khoản cũ
export async function unregisterPush({ remote = true } = {}) {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  if (!remote) return;
  try {
    await api.delete("/me/device-tokens", { params: { token } });
  } catch {
    // Không gỡ được: BE vẫn gán lại token cho người đăng nhập sau (cột token unique)
  }
}

// Người dùng bấm vào thông báo (app đang mở, ở nền, hoặc mở app từ thông báo). Trả hàm huỷ
export function listenPushTap(onTap) {
  if (!pushSupported()) return () => {};
  const sub = N.addNotificationResponseReceivedListener((res) =>
    onTap(pushData(res.notification)),
  );
  // Mở app từ trạng thái TẮT bằng cách bấm thông báo
  N.getLastNotificationResponseAsync()
    .then((res) => {
      if (res) {
        onTap(pushData(res.notification));
        N.clearLastNotificationResponseAsync?.();
      }
    })
    .catch(() => {});
  return () => sub.remove();
}
