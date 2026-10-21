import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { showToast } from "@/utils/toast";
import { CHAT_LIMITS } from "@/constants/chat";
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

// CH-02 · mới nhất trước (FlatList inverted). active = phòng đang mở → hỏi lại 3 giây/lần
export function useMessages(id, active) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(id),
    queryFn: ({ pageParam }) => chatApi.getMessages(id, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.content),
    enabled: !!id,
    refetchInterval: active ? CHAT_LIMITS.ROOM_POLL_MS : false,
  });
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

// Gửi LẠC QUAN: hiện bong bóng "đang gửi" ngay (id tạm), xong thay bằng tin thật; lỗi → bong bóng "Gửi lại"
export function useSendMessage(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content }) => chatApi.sendMessage(id, content),
    onMutate: async ({ content, tempId }) => {
      await qc.cancelQueries({ queryKey: chatKeys.messages(id) });
      const temp = {
        id: tempId,
        content,
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
    onError: (_e, { tempId }) =>
      patchMessages(qc, id, (list) =>
        list.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      ),
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
