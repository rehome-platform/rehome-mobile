import { api, unwrap } from "@/lib/api/client";

// ===== Phase 6 [CHỜ BE] — theo API_CONTRACT, BE a0c6abe mới có entity, chưa có controller =====

export const getConversations = async () =>
  unwrap(await api.get("/conversations")); // API 110

// [CHỜ BE] chưa có trong contract — tạm tìm trong danh sách
export const getConversation = async (id) => {
  const list = await getConversations();
  const c = list.find((x) => x.id === id);
  if (!c) throw new Error("Không tìm thấy hội thoại.");
  return c;
};

export const openConversation = async ({ type, counterpartId }) =>
  unwrap(await api.post("/conversations", { type, counterpartId })); // API 111

export const getMessages = async (id, { page = 0, size = 30 } = {}) =>
  unwrap(
    await api.get(`/conversations/${id}/messages`, { params: { page, size } }),
  ); // API 112

export const sendMessage = async (id, content) =>
  unwrap(await api.post(`/conversations/${id}/messages`, { content })); // API 113

// [CHỜ BE câu 16] chưa có trong contract
export const markRead = async (id) =>
  unwrap(await api.patch(`/conversations/${id}/read`));
