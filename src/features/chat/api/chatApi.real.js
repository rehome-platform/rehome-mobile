import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/roles";
import { CONVERSATION_TYPE as C } from "@/constants/chat";

// Chat thật (API 110–113) cho cả Member và Tổ chức. Cùng hình dạng dữ liệu với chatApi.mock.js.
// BE trả: counterpart { id, displayName, avatarUrl }, lastMessage { content, createdAt, senderId }, unreadCount;
// tin nhắn có isMine; có GET /conversations/{id}. Mở phòng (GET messages) BE tự đánh dấu đã đọc → markRead không gọi gì

const isOrg = () => useAuthStore.getState().user?.role === ROLES.ORGANIZATION;
const myAccountId = () => useAuthStore.getState().user?.accountId;

const FALLBACK_NAME = {
  [C.MEMBER_WAREHOUSE]: "Kho ReHome",
  [C.MEMBER_ORGANIZATION]: "Tổ chức",
};

// Tin cuối của mình? Member: so với accountId; Tổ chức: tin không phải của đối tác (Member)
const lastIsMine = (c) => {
  const sender = c.lastMessage?.senderId;
  if (!sender) return false;
  return isOrg() ? sender !== c.counterpart?.id : sender === myAccountId();
};

const toConversation = (c) => ({
  id: c.id,
  type: c.type,
  counterpart: {
    id: c.counterpart?.id ?? null,
    displayName:
      c.counterpart?.displayName ??
      (isOrg() ? "Thành viên" : FALLBACK_NAME[c.type]),
    avatarUrl: c.counterpart?.avatarUrl ?? null,
    verified: !isOrg() && c.type === C.MEMBER_ORGANIZATION, // Member chỉ chat được với tổ chức đã xác minh
  },
  // BE cũ trả chuỗi → vẫn nhận
  lastMessage: c.lastMessage
    ? typeof c.lastMessage === "string"
      ? { content: c.lastMessage, createdAt: null, isMine: false }
      : {
          content: c.lastMessage.content ?? "",
          createdAt: c.lastMessage.createdAt ?? null,
          isMine: lastIsMine(c),
        }
    : null,
  unreadCount: c.unreadCount ?? 0,
});

// GET /conversations — BE xếp theo tin cuối, mới nhất trước
export async function getConversations() {
  return (unwrap(await api.get("/conversations")) ?? []).map(toConversation);
}

// GET /conversations/{id}
export async function getConversation(id) {
  return toConversation(unwrap(await api.get(`/conversations/${id}`)));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /conversations (chỉ Member) → { id, type }; đã có thì BE trả hội thoại cũ
export async function openConversation({ type, counterpartId }) {
  if (!UUID_RE.test(counterpartId ?? ""))
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Không mở được hội thoại này.",
    });
  return unwrap(await api.post("/conversations", { type, counterpartId }));
}

const toMessage = (m) => ({
  id: m.id,
  senderId: m.senderId,
  content: m.content,
  createdAt: m.createdAt,
  isMine: !!m.isMine,
});

// GET /conversations/{id}/messages — mới nhất trước (khớp FlatList inverted). BE tự đánh dấu đã đọc
export async function getMessages(id, { page = 0, size = 30 } = {}) {
  const p = unwrap(
    await api.get(`/conversations/${id}/messages`, { params: { page, size } }),
  );
  return { ...p, content: (p.content ?? []).map(toMessage) };
}

// POST /conversations/{id}/messages
export async function sendMessage(id, content) {
  const m = unwrap(
    await api.post(`/conversations/${id}/messages`, { content }),
  );
  return { ...toMessage(m), isMine: true };
}

// BE đánh dấu đã đọc ngay khi đọc tin (getMessages) → không cần gọi thêm
export async function markRead() {
  return null;
}
