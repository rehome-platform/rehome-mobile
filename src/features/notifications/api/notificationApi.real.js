import { api, unwrap } from "@/lib/api/client";

// ===== Phase 6 [CHỜ BE] — theo API_CONTRACT, BE a0c6abe mới có entity, chưa có controller =====

export const getNotifications = async ({ page = 0, size = 20 } = {}) =>
  unwrap(await api.get("/notifications", { params: { page, size } })); // API 114

// [CHỜ BE câu 17] chưa có trong contract
export const getUnreadCount = async () =>
  unwrap(await api.get("/notifications/unread-count"));

export const markRead = async (id) =>
  unwrap(await api.patch(`/notifications/${id}/read`)); // API 115

export const markAllRead = async () =>
  unwrap(await api.patch("/notifications/read-all")); // API 116
