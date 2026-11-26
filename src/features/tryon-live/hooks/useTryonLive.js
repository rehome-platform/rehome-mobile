import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { tryonLiveApi } from "../api/tryonLiveApi";
import { tryonLiveKeys } from "../api/queryKeys";

// Gọi khi mở màn hình thử đồ AI real-time, trước khi xin quyền camera — biết ngay còn lượt hay không
// enabled = false cho khách (API cần đăng nhập) — vd. dòng "Còn x/y lượt" ở trang sản phẩm
export function useTryonLiveQuota({ enabled = true } = {}) {
  return useQuery({
    queryKey: tryonLiveKeys.quota,
    queryFn: tryonLiveApi.getQuota,
    staleTime: 0, // luôn hỏi lại BE, quota đổi liên tục trong ngày
    enabled,
  });
}

// Mở phiên: BE kiểm còn lượt + mint client token Decart cho WebView (chưa trừ lượt)
export function useStartLiveTryon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => tryonLiveApi.startSession(productId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tryonLiveKeys.quota }),
  });
}

// Khung hình AI đầu tiên đã hiện → BE trừ lượt. Mạng chập chờn thì thử lại 1 lần
// (lỗi có mã từ BE như hết lượt thì không thử lại)
export function useMarkLiveTryonStarted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => tryonLiveApi.markStarted(sessionId),
    retry: (count, e) =>
      count < 1 && (e?.code === "NETWORK" || e?.code === "TIMEOUT"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tryonLiveKeys.quota }),
  });
}

// Lịch sử video đã quay — cuộn vô hạn; trả { items, total }.
// staleTime 0: video mới được WebView upload thẳng lên BE nên app không biết để làm mới cache
export function useLiveTryonHistory() {
  return useInfiniteQuery({
    queryKey: tryonLiveKeys.history,
    queryFn: ({ pageParam }) => tryonLiveApi.getHistory({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.content),
      total: data.pages[0]?.totalElements ?? 0,
    }),
    staleTime: 0,
  });
}

// Xoá video đã quay → làm mới danh sách lịch sử
export function useDeleteLiveTryon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => tryonLiveApi.deleteSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tryonLiveKeys.history }),
  });
}

// Chỉ gọi khi KHÔNG có video để upload (mất kết nối giữa chừng...) - xem tryonLiveApi.real.js
export function useCompleteLiveTryon() {
  return useMutation({
    mutationFn: ({ sessionId, status, actualDurationSeconds }) =>
      tryonLiveApi.completeSession(sessionId, { status, actualDurationSeconds }),
  });
}
