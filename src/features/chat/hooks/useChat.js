import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import { MOCK } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";
import { subscribe, useSocketStore } from "@/lib/realtime/socket";
import { ROLES } from "@/constants/roles";
import { askLogin } from "@/utils/askLogin";
import { showToast } from "@/utils/toast";
import { CHAT_LIMITS } from "@/constants/chat";
import { ERROR_CODES } from "@/constants/errorCodes";
import { chatApi } from "../api/chatApi";
import { chatKeys } from "../api/queryKeys";

// CH-01 + badge. poll = đang mở màn có số chưa đọc → hỏi lại 30 giây/lần (chưa có realtime — 0.5 A18)
export function useConversations({ poll = false } = {}) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: chatKeys.list,
    queryFn: chatApi.getConversations,
    enabled: isAuthed,
    refetchInterval: poll ? CHAT_LIMITS.LIST_POLL_MS : false,
  });
}

export function useConversation(id) {
  return useQuery({
    queryKey: chatKeys.conversation(id),
    queryFn: () => chatApi.getConversation(id),
    enabled: !!id,
  });
}

// CH-02 · mới nhất trước (FlatList inverted). active = phòng đang mở.
// Có WebSocket thì tin mới đến qua useRoomSocket → không hỏi lại; mất kết nối thì hỏi lại 3 giây/lần như cũ
export function useMessages(id, active) {
  const live = useSocketStore((s) => s.connected);
  return useInfiniteQuery({
    queryKey: chatKeys.messages(id),
    queryFn: ({ pageParam }) => chatApi.getMessages(id, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.content),
    enabled: !!id,
    refetchInterval: active && !live ? CHAT_LIMITS.ROOM_POLL_MS : false,
  });
}

// Tin của mình? Tin qua WebSocket luôn isMine = false (BE gửi 1 bản chung) → tự so senderId.
// Member: so với accountId của mình. Tổ chức (hồ sơ không có accountId): tin không phải của đối tác (Member)
const isMineSocket = (senderId, conversation) => {
  const user = useAuthStore.getState().user;
  return user?.role === ROLES.ORGANIZATION
    ? senderId !== conversation?.counterpart?.id
    : senderId === user?.accountId;
};

// Nhận tin mới của phòng đang mở qua /topic/conversations.{id}. Chỉ đăng ký khi ĐÃ tải được hội thoại
// (BE chặn người ngoài hội thoại bằng frame ERROR — đóng cả kết nối, mất luôn kênh thông báo).
// Tin của mình bỏ qua: đã có từ REST (gửi lạc quan), thêm nữa sẽ hiện 2 lần.
// Tin của đối tác chèn đầu danh sách → latestTheirs đổi → ChatRoomScreen gọi markRead (BE ghi đã đọc)
export function useRoomSocket(id, conversation, active) {
  const qc = useQueryClient();
  const ready = active && !!conversation && !MOCK.chat;
  useEffect(() => {
    if (!ready) return;
    return subscribe(`/topic/conversations.${id}`, (m) => {
      if (!m?.id || isMineSocket(m.senderId, conversation)) return;
      const msg = {
        id: m.id,
        senderId: m.senderId,
        content: m.content ?? "",
        imageUrls: m.imageUrls ?? [],
        createdAt: m.createdAt,
        isMine: false,
      };
      qc.setQueryData(chatKeys.messages(id), (data) => {
        if (
          !data ||
          data.pages.some((p) => p.content.some((x) => x.id === msg.id))
        )
          return data; // đã có (vừa tải lại cùng lúc)
        return {
          ...data,
          pages: data.pages.map((pg, i) =>
            i === 0 ? { ...pg, content: [msg, ...pg.content] } : pg,
          ),
        };
      });
    });
  }, [ready, id, conversation?.counterpart?.id]);
}

// Sửa tin trong cache (mọi trang)
const patchMessages = (qc, id, fn) =>
  qc.setQueryData(chatKeys.messages(id), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((pg) => ({ ...pg, content: fn(pg.content) })),
        }
      : data,
  );

// Gửi LẠC QUAN: hiện bong bóng "đang gửi" ngay (id tạm, ảnh trong máy), upload ảnh rồi gửi; xong thay bằng tin
// thật (chữ BE đã che SĐT / email / số tài khoản); lỗi → bong bóng "Gửi lại" (giữ ảnh trong máy để upload lại).
// Gửi quá nhanh (429 MESSAGE_RATE_LIMITED) → báo câu của BE
const isRemote = (uri) => /^https?:\/\//.test(uri ?? "");
export function useSendMessage(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, images = [] }) => {
      const urls = await Promise.all(
        images.map((uri) =>
          isRemote(uri) ? uri : chatApi.uploadChatImage(uri),
        ),
      );
      return chatApi.sendMessage(id, content, urls);
    },
    onMutate: async ({ content, images = [], tempId }) => {
      await qc.cancelQueries({ queryKey: chatKeys.messages(id) });
      const temp = {
        id: tempId,
        content,
        imageUrls: images,
        createdAt: new Date().toISOString(),
        isMine: true,
        pending: true,
      };
      qc.setQueryData(chatKeys.messages(id), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((pg, i) =>
                i === 0 ? { ...pg, content: [temp, ...pg.content] } : pg,
              ),
            }
          : data,
      );
    },
    onSuccess: (msg, { tempId }) =>
      patchMessages(qc, id, (list) =>
        list.map((m) => (m.id === tempId ? msg : m)),
      ),
    onError: (e, { tempId }) => {
      if (e?.code === ERROR_CODES.MESSAGE_RATE_LIMITED) showToast(e.message);
      patchMessages(qc, id, (list) =>
        list.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: chatKeys.list }),
  });
}

// Bỏ bong bóng lỗi khỏi cache (trước khi gửi lại)
export function useDropFailed(id) {
  const qc = useQueryClient();
  return (tempId) =>
    patchMessages(qc, id, (list) => list.filter((m) => m.id !== tempId));
}

// Mở phòng → đánh dấu đã đọc + làm mới badge
export function useMarkRead(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.list }),
  });
}

// Mở chat từ ngữ cảnh (tổ chức, chiến dịch, đơn, ký gửi): tạo / lấy hội thoại rồi vào phòng.
// draft = câu soạn sẵn trong ô nhập (KHÔNG tự gửi). from = màn quay lại sau khi Guest đăng nhập
export function useOpenConversation() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const qc = useQueryClient();
  const m = useMutation({ mutationFn: chatApi.openConversation });
  const open = ({ type, counterpartId, draft, from = "/" }) => {
    if (!isAuthed)
      return askLogin(
        from,
        "Đăng nhập để nhắn tin",
        "Bạn cần đăng nhập để nhắn tin.",
      );
    m.mutate(
      { type, counterpartId },
      {
        onSuccess: (c) => {
          qc.invalidateQueries({ queryKey: chatKeys.list });
          router.push({
            pathname: `/messages/${c.id}`,
            params: draft ? { draft } : {},
          });
        },
        onError: (e) => showToast(e.message),
      },
    );
  };
  return { open, isOpening: m.isPending };
}
