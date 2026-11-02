import { api, unwrap } from "@/lib/api/client";
import { NOTIFICATION_TYPE as N } from "@/constants/notification";

// Thông báo thật (API 114, BE 2c9533b) cho Member và Tổ chức. Cùng hình dạng với notificationApi.mock.js.
// BE mới có GET /notifications → { id, type, message, isRead, createdAt }. Chỗ thiếu (đã báo BE):
// - không có tiêu đề → lấy theo loại; không có targetType/targetId → bấm chỉ đánh dấu đã đọc, không mở màn
// - [CHỜ BE] API 115–116 (đánh dấu đã đọc) + số chưa đọc → đánh dấu tạm trên máy (mất khi tắt app),
//   số chưa đọc đếm từ trang đầu

const TITLE = {
  [N.ORDER_UPDATE]: "Cập nhật đơn hàng",
  [N.WALLET_EVENT]: "Ví ReHome",
  [N.TERM_EXPIRY]: "Sắp hết hạn",
  [N.VERIFICATION_RESULT]: "Kết quả xét duyệt",
  [N.QUEUE_TASK]: "Việc cần xử lý",
};

const readOnDevice = new Set(); // id đã bấm / "Đánh dấu đã đọc" trong phiên này
let lastSeen = []; // id của trang đầu gần nhất → "đánh dấu tất cả"

const toNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: TITLE[n.type] ?? "Thông báo",
  body: n.message ?? "",
  isRead: n.isRead || readOnDevice.has(n.id),
  createdAt: n.createdAt,
  targetType: null,
  targetId: null,
});

// GET /notifications — mới nhất trước
export async function getNotifications({ page = 0, size = 20 } = {}) {
  const p = unwrap(await api.get("/notifications", { params: { page, size } }));
  const content = (p.content ?? []).map(toNotification);
  if (page === 0) lastSeen = content.map((n) => n.id);
  return { ...p, content };
}

// [CHỜ BE] chưa có API số chưa đọc → đếm trong 50 thông báo mới nhất
export async function getUnreadCount() {
  const { content } = await getNotifications({ page: 0, size: 50 });
  return { count: content.filter((n) => !n.isRead).length };
}

// [CHỜ BE API 115]
export async function markRead(id) {
  readOnDevice.add(id);
  return null;
}

// [CHỜ BE API 116]
export async function markAllRead() {
  lastSeen.forEach((id) => readOnDevice.add(id));
  return null;
}
