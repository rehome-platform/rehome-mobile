// Mock chat (API 110–113) "sống" trong RAM. Đối tác: kho (WAREHOUSES mock ký gửi) hoặc tổ chức (communityApi.mock).
// Gửi tin → 2–4 giây sau đối tác TỰ TRẢ LỜI một câu mẫu (để thấy tự hỏi lại chạy) [chỉ mock].
// Field mobile xin thêm [CHỜ BE PHASE6_GUIDE câu 16]: counterpart {displayName, avatarUrl, verified},
// lastMessage {content, createdAt, isMine}, isMine ở từng tin. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { CHAT_LIMITS, CONVERSATION_TYPE as C } from "@/constants/chat";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import { mockFindOrg } from "@/features/community/api/communityApi.mock";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const ME = "me";
const notFound = () =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: "Không tìm thấy hội thoại.",
  });

const REPLY = {
  [C.MEMBER_WAREHOUSE]:
    "Chào bạn, nhân viên kho đã nhận tin và sẽ kiểm tra giúp bạn ngay.",
  [C.MEMBER_ORGANIZATION]:
    "Cảm ơn bạn đã nhắn! Bên mình sẽ trả lời chi tiết sớm nhé.",
};

const counterpartOf = (type, id) => {
  if (type === C.MEMBER_WAREHOUSE) {
    const w = WAREHOUSES.find((x) => x.id === id);
    return w
      ? { id: w.id, displayName: w.name, avatarUrl: null, verified: false }
      : null;
  }
  const o = mockFindOrg(id);
  return o
    ? {
        id: o.id,
        displayName: o.displayName,
        avatarUrl: o.logoUrl,
        verified: true,
      }
    : null;
};

let conversations = [];
let messages = [];
let seq = 0;
let failNext = false;

const conv = (id, type, counterpartId, unreadCount = 0) =>
  conversations.push({
    id,
    type,
    counterpartId,
    unreadCount,
    createdAt: ago(30, "day"),
  });
const msg = (conversationId, fromMe, content, minutesAgo) => {
  seq += 1;
  messages.push({
    id: `msg-${seq}`,
    conversationId,
    senderId: fromMe ? ME : "other",
    content,
    createdAt: ago(minutesAgo, "minute"),
  });
};

// ---------- Dữ liệu mẫu (theo CH-01 / CH-02) ----------
conv("cv-wh-q1", C.MEMBER_WAREHOUSE, "wh-q1", 1);
msg(
  "cv-wh-q1",
  true,
  "Áo sơ mi linen của mình ký gửi hôm kia sao chưa lên app vậy ạ?",
  26 * 60,
);
msg(
  "cv-wh-q1",
  false,
  "Chào bạn, món này đang chờ in tem và nhập kho. Sáng mai sẽ lên app, bạn sẽ nhận thông báo.",
  25 * 60,
);
msg(
  "cv-wh-q1",
  false,
  "Chào bạn, hàng của bạn đã được nhập kho và đang bán với giá 185.000 đ.",
  90,
);

conv("cv-hoa-sen", C.MEMBER_ORGANIZATION, "org-hoa-sen", 0);
msg(
  "cv-hoa-sen",
  true,
  "Chào bên mình, mình có khoảng 3 túi áo khoác mùa đông muốn quyên góp ạ.",
  28 * 60,
);
msg(
  "cv-hoa-sen",
  false,
  "Cảm ơn bạn! Bên mình nhận đồ đến 17h mỗi ngày, bạn mang tới địa chỉ trụ sở nhé.",
  27 * 60,
);
msg("cv-hoa-sen", true, "Dạ mai mình mang tới ạ.", 26 * 60);

conv("cv-bk", C.MEMBER_ORGANIZATION, "org-bk", 2);
msg("cv-bk", true, "Bên mình còn nhận đồ không ạ?", 5 * 24 * 60);
msg(
  "cv-bk",
  false,
  "Còn bạn nhé! Bên mình cần thêm quần áo trẻ em size 6–8.",
  4 * 24 * 60,
);
msg("cv-bk", false, "Bạn mang tới sảnh B4 sáng thứ Bảy nhé.", 4 * 24 * 60 - 10);

conv("cv-hat-mam", C.MEMBER_ORGANIZATION, "org-hat-mam", 0);
msg(
  "cv-hat-mam",
  false,
  "Chào bạn, quỹ vẫn nhận áo ấm tới hết tháng 12.",
  7 * 24 * 60,
);
msg(
  "cv-hat-mam",
  true,
  "Mình mang 2 túi áo khoác tới thứ Bảy nhé.",
  6 * 24 * 60,
);

// ---------- Chuyển dữ liệu ra ngoài ----------
const toMessage = (m) => ({
  id: m.id,
  senderId: m.senderId,
  content: m.content,
  createdAt: m.createdAt,
  isMine: m.senderId === ME, // [CHỜ BE câu 16] cách biết tin của mình
});
const lastOf = (id) =>
  messages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))[0];

const toConversation = (c) => {
  const last = lastOf(c.id);
  return {
    id: c.id,
    type: c.type,
    counterpart: counterpartOf(c.type, c.counterpartId),
    lastMessage: last
      ? {
          content: last.content,
          createdAt: last.createdAt,
          isMine: last.senderId === ME,
        }
      : null,
    unreadCount: c.unreadCount,
  };
};
const findConv = (id) => {
  const c = conversations.find((x) => x.id === id);
  if (!c) throw notFound();
  return c;
};

// ---------- API 110 ---------- hộp thư kho lên đầu, rồi tin mới nhất trước
export async function getConversations() {
  await delay();
  return conversations.map(toConversation).sort((a, b) => {
    const wa = a.type === C.MEMBER_WAREHOUSE;
    const wb = b.type === C.MEMBER_WAREHOUSE;
    if (wa !== wb) return wa ? -1 : 1;
    return dayjs(b.lastMessage?.createdAt).diff(a.lastMessage?.createdAt);
  });
}

// [CHỜ BE] chưa có GET /conversations/{id} — lấy từ danh sách
export async function getConversation(id) {
  await delay(200);
  return toConversation(findConv(id));
}

// ---------- API 111 ---------- đã có thì trả hội thoại cũ
export async function openConversation({ type, counterpartId }) {
  await delay();
  const found = conversations.find(
    (c) => c.type === type && c.counterpartId === counterpartId,
  );
  if (found) return { id: found.id, type: found.type };
  if (!counterpartOf(type, counterpartId)) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy nơi nhận tin.",
    });
  }
  seq += 1;
  const id = `cv-${seq}`;
  conv(id, type, counterpartId, 0);
  return { id, type };
}

// ---------- API 112 ---------- mới nhất trước (khớp FlatList inverted)
export async function getMessages(id, { page = 0, size = 30 } = {}) {
  await delay(300);
  findConv(id);
  const list = messages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))
    .map(toMessage);
  return {
    content: list.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
  };
}

// ---------- API 113 ----------
export async function sendMessage(id, content) {
  await delay(500);
  const c = findConv(id);
  if (failNext) {
    failNext = false;
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: "Mất kết nối, chưa gửi được.",
    });
  }
  const text = content?.trim();
  if (!text || text.length > CHAT_LIMITS.MAX_CHARS) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Tin nhắn không hợp lệ.",
    });
  }
  seq += 1;
  const m = {
    id: `msg-${seq}`,
    conversationId: id,
    senderId: ME,
    content: text,
    createdAt: dayjs().toISOString(),
  };
  messages.push(m);
  // [MOCK] đối tác tự trả lời sau 2–4 giây
  setTimeout(
    () => {
      seq += 1;
      messages.push({
        id: `msg-${seq}`,
        conversationId: id,
        senderId: "other",
        content: REPLY[c.type],
        createdAt: dayjs().toISOString(),
      });
      c.unreadCount += 1;
    },
    2000 + Math.random() * 2000,
  );
  return toMessage(m);
}

// [CHỜ BE câu 16] đánh dấu đã đọc
export async function markRead(id) {
  await delay(150);
  findConv(id).unreadCount = 0;
  return null;
}

// ---------- [DEV] ----------
export const mockFailNextSend = () => {
  failNext = true;
};
