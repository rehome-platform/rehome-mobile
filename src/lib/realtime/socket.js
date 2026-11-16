import "./textCodecPolyfill";
import { Client, ReconnectionTimeMode } from "@stomp/stompjs";
import { create } from "zustand";
import { ENV } from "@/config/env";
import { getFreshAccessToken } from "@/lib/api/client";

// Một kết nối STOMP dùng chung cả app (BE: WebSocketConfig). App dùng /ws (STOMP thuần), web mới dùng /ws-sockjs.
// JWT gửi trong header STOMP "Authorization" của frame CONNECT (không phải header HTTP).
// BE chỉ kiểm token lúc CONNECT → mỗi lần (kết nối lại) đều lấy token mới nhất, sắp hết hạn thì refresh trước.
// Gửi tin vẫn qua REST; socket chỉ để NHẬN.
const WS_URL = `${ENV.API_BASE_URL.replace(/\/$/, "").replace(/^http/, "ws")}/ws`;

// connected: màn nào đang tự hỏi lại (poll) thì tạm dừng khi true, chạy lại khi mất kết nối
export const useSocketStore = create(() => ({ connected: false }));
const setConnected = (connected) => useSocketStore.setState({ connected });

let client = null;
// Các đăng ký đang sống (giữ qua lần kết nối lại → onConnect đăng ký lại hết)
const subs = new Map();

function subscribeNow(entry) {
  entry.stomp = client.subscribe(entry.destination, (frame) => {
    let body;
    try {
      body = JSON.parse(frame.body);
    } catch {
      return;
    }
    entry.handler(body);
  });
}

export function startSocket() {
  if (client?.active || !ENV.API_BASE_URL) return;
  client = new Client({
    brokerURL: WS_URL,
    // React Native: WebSocket gửi chuỗi không chuẩn khung STOMP → 2 cờ này theo hướng dẫn của stompjs cho RN
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    // Mất mạng / server ngủ → thử lại 3 giây, gấp đôi mỗi lần, tối đa 1 phút
    reconnectDelay: 3000,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: 60000,
    beforeConnect: async (c) => {
      try {
        const token = await getFreshAccessToken();
        c.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      } catch {
        c.connectHeaders = {}; // refresh lỗi (mất mạng…) → BE từ chối, lần thử sau lấy lại
      }
    },
    onConnect: () => {
      setConnected(true);
      subs.forEach(subscribeNow);
    },
    onWebSocketClose: () => setConnected(false),
    // BE trả ERROR khi token sai / tài khoản bị khoá / subscribe hội thoại không thuộc về mình
    onStompError: () => setConnected(false),
  });
  client.activate();
}

export function stopSocket() {
  const c = client;
  client = null;
  subs.forEach((entry) => {
    entry.stomp = null;
  });
  setConnected(false);
  c?.deactivate();
}

// Đăng ký nhận ở một địa chỉ; trả hàm huỷ. Chưa kết nối thì tự đăng ký khi kết nối xong.
// handler nhận body đã JSON.parse
export function subscribe(destination, handler) {
  const key = Symbol(destination);
  const entry = { destination, handler, stomp: null };
  subs.set(key, entry);
  if (client?.connected) subscribeNow(entry);
  return () => {
    subs.delete(key);
    try {
      entry.stomp?.unsubscribe();
    } catch {}
  };
}
