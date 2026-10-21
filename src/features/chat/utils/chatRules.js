import dayjs from "dayjs";
import { CONVERSATION_TYPE as C } from "@/constants/chat";

const WEEKDAY = ["CN", "T.2", "T.3", "T.4", "T.5", "T.6", "T.7"];

export const isWarehouse = (conv) => conv?.type === C.MEMBER_WAREHOUSE;

// Danh sách hội thoại: "09:42" · "Hôm qua" · "T.5" (trong tuần) · "08/10"
export function formatChatTime(at) {
  if (!at) return "";
  const t = dayjs(at);
  const now = dayjs();
  if (t.isSame(now, "day")) return t.format("HH:mm");
  if (t.isSame(now.subtract(1, "day"), "day")) return "Hôm qua";
  if (now.diff(t, "day") < 7) return WEEKDAY[t.day()];
  return t.format("DD/MM");
}

// Dải ngày trong phòng chat: "Hôm nay" · "Hôm qua" · "08/10/2026"
export function dayLabel(at) {
  const t = dayjs(at);
  const now = dayjs();
  if (t.isSame(now, "day")) return "Hôm nay";
  if (t.isSame(now.subtract(1, "day"), "day")) return "Hôm qua";
  return t.format("DD/MM/YYYY");
}

// Dòng tin cuối ở CH-01: tin của mình có "Bạn: "
export const previewOf = (conv) =>
  conv.lastMessage
    ? `${conv.lastMessage.isMine ? "Bạn: " : ""}${conv.lastMessage.content}`
    : "Chưa có tin nhắn";

// Tổng số tin chưa đọc (badge tab Cá nhân)
export const unreadTotal = (list = []) =>
  list.reduce((s, c) => s + (c.unreadCount ?? 0), 0);
