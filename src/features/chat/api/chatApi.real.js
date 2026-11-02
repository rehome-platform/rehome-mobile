import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/roles";
import { CONVERSATION_TYPE as C } from "@/constants/chat";

// Chat thật (API 110–113, BE 2c9533b) cho cả Member và Tổ chức. Cùng hình dạng dữ liệu với chatApi.mock.js.
// Chỗ BE chưa có / khác (đã báo):
// - counterpart chỉ có { id, displayName } → không avatar; lastMessage là chuỗi, không giờ, không biết của ai
// - không có GET /conversations/{id} → tìm trong danh sách
// - mở phòng (GET messages) BE tự đánh dấu đã đọc → markRead không gọi gì
// - tin không có isMine → Member so senderId với accountId của mình; Tổ chức: tin không phải của đối tác (Member)

const isOrg = () => useAuthStore.getState().user?.role === ROLES.ORGANIZATION;
const myAccountId = () => useAuthStore.getState().user?.accountId;

const FALLBACK_NAME = {
  [C.MEMBER_WAREHOUSE]: "Kho ReHome",
  [C.MEMBER_ORGANIZATION]: "Tổ chức",
};

const toConversation = (c) => ({
  id: c.id,
  type: c.type,
  counterpart: {
    id: c.counterpart?.id ?? null,
    displayName:
      c.counterpart?.displayName ??
      (isOrg() ? "Thành viên" : FALLBACK_NAME[c.type]),
    avatarUrl: null,
    verified: !isOrg() && c.type === C.MEMBER_ORGANIZATION, // Member chỉ chat được với tổ chức đã xác minh
  },
  lastMessage: c.lastMessage
    ? { content: c.lastMessage, createdAt: null, isMine: false }
    : null,
  unreadCount: c.unreadCount ?? 0,
});

// id hội thoại → id đối tác (để Tổ chức nhận ra tin của mình). Điền mỗi lần tải danh sách
const counterparts = new Map();

// GET /conversations — hộp thư kho lên đầu, còn lại giữ thứ tự BE (hội thoại mới tạo trước)
export async function getConversations() {
  const list = (unwrap(await api.get("/conversations")) ?? []).map(
    toConversation,
  );
  list.forEach((c) => counterparts.set(c.id, c.counterpart.id));
  const wh = (c) => (c.type === C.MEMBER_WAREHOUSE ? 0 : 1);
  return list.sort((a, b) => wh(a) - wh(b));
}

// [CHỜ BE] chưa có GET /conversations/{id}
export async function getConversation(id) {
  const c = (await getConversations()).find((x) => x.id === id);
  if (!c)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy hội thoại.",
    });
  return c;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /conversations (chỉ Member) → { id, type }; đã có thì BE trả hội thoại cũ
export async function openConversation({ type, counterpartId }) {
  // Trang tổ chức / chiến dịch còn dữ liệu mock (id kiểu "org-…") → BE sẽ báo 400 khó hiểu
  if (!UUID_RE.test(counterpartId ?? ""))
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Nhắn tin với tổ chức sẽ mở khi phần Cộng đồng có dữ liệu thật.",
    });
  return unwrap(await api.post("/conversations", { type, counterpartId }));
}

const toMessage = (m, mine) => ({
  id: m.id,
  senderId: m.senderId,
  content: m.content,
  createdAt: m.createdAt,
  isMine: mine(m),
});

// Hàm nhận ra tin của mình trong một hội thoại
async function mineIn(id) {
  if (!isOrg()) {
    const me = myAccountId();
    return (m) => m.senderId === me;
  }
  if (!counterparts.has(id)) await getConversations();
  const member = counterparts.get(id);
  return (m) => m.senderId !== member;
}

// GET /conversations/{id}/messages — mới nhất trước (khớp FlatList inverted). BE tự đánh dấu đã đọc
export async function getMessages(id, { page = 0, size = 30 } = {}) {
  const [res, mine] = await Promise.all([
    api.get(`/conversations/${id}/messages`, { params: { page, size } }),
    mineIn(id),
  ]);
  const p = unwrap(res);
  return { ...p, content: (p.content ?? []).map((m) => toMessage(m, mine)) };
}

// POST /conversations/{id}/messages
export async function sendMessage(id, content) {
  const m = unwrap(
    await api.post(`/conversations/${id}/messages`, { content }),
  );
  return toMessage(m, () => true);
}

// BE đánh dấu đã đọc ngay khi đọc tin (getMessages) → không cần gọi thêm
export async function markRead() {
  return null;
}
