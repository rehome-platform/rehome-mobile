import { api, unwrap } from "@/lib/api/client";
import { NOTIFICATION_TYPE as N } from "@/constants/notification";

// Thông báo thật (API 114–116) cho Member và Tổ chức. Cùng hình dạng với notificationApi.mock.js.
// BE trả { id, type, title, message, isRead, targetType, targetId, warehouseId, createdAt }.
// Thông báo cũ chưa có tiêu đề → lấy theo loại

const TITLE = {
  [N.ORDER_UPDATE]: "Cập nhật đơn hàng",
  [N.WALLET_EVENT]: "Ví ReHome",
  [N.TERM_EXPIRY]: "Sắp hết hạn",
  [N.VERIFICATION_RESULT]: "Kết quả xét duyệt",
  [N.QUEUE_TASK]: "Việc cần xử lý",
  [N.DONATION_RECORDED]: "Có lượt quyên góp mới",
  [N.COMMENT_REPLIED]: "Có người trả lời bình luận của bạn",
  [N.POST_COMMENTED]: "Bài viết có bình luận mới",
};

const toNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title || TITLE[n.type] || "Thông báo",
  body: n.message ?? "",
  isRead: !!n.isRead,
  createdAt: n.createdAt,
  targetType: n.targetType ?? null,
  targetId: n.targetId ?? null,
  warehouseId: n.warehouseId ?? null,
});

// GET /notifications — mới nhất trước
export async function getNotifications({ page = 0, size = 20 } = {}) {
  const p = unwrap(await api.get("/notifications", { params: { page, size } }));
  return { ...p, content: (p.content ?? []).map(toNotification) };
}

// GET /notifications/unread-count → { count }
export async function getUnreadCount() {
  const res = unwrap(await api.get("/notifications/unread-count"));
  return { count: res?.count ?? 0 };
}

// PATCH /notifications/{id}/read
export async function markRead(id) {
  return unwrap(await api.patch(`/notifications/${id}/read`));
}

// PATCH /notifications/read-all
export async function markAllRead() {
  return unwrap(await api.patch("/notifications/read-all"));
}
