import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { NOTIFICATION_LIMITS } from "@/constants/notification";
import { notificationApi } from "../api/notificationApi";
import { notificationKeys } from "../api/queryKeys";

// PR-05 · mới nhất trước
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) =>
      notificationApi.getNotifications({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.content),
  });
}

// Chuông: hỏi lại 60 giây/lần + mỗi lần màn chứa chuông được mở lại (bấm Khung Mock ở màn khác rồi quay về)
export function useUnreadNotifications() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: notificationApi.getUnreadCount,
    select: (d) => d?.count ?? 0,
    enabled: isAuthed,
    refetchInterval: NOTIFICATION_LIMITS.UNREAD_POLL_MS,
  });
  useFocusEffect(
    useCallback(() => {
      if (isAuthed) query.refetch();
    }, [isAuthed]),
  );
  return query;
}

// Đánh dấu một / tất cả đã đọc → làm mới danh sách + chuông
export function useMarkNotification() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const one = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: refresh,
  });
  const all = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: refresh,
  });
  return {
    markRead: one.mutate,
    markAllRead: all.mutate,
    isMarkingAll: all.isPending,
  };
}
