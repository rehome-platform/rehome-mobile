import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tryonLiveApi } from "../api/tryonLiveApi";
import { tryonLiveKeys } from "../api/queryKeys";

// Gọi khi mở màn hình thử đồ AI real-time, trước khi xin quyền camera — biết ngay còn lượt hay không
export function useTryonLiveQuota() {
  return useQuery({
    queryKey: tryonLiveKeys.quota,
    queryFn: tryonLiveApi.getQuota,
    staleTime: 0, // luôn hỏi lại BE, quota đổi liên tục trong ngày
  });
}

// Trừ quota ở BE + mint client token Decart cho WebView
export function useStartLiveTryon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => tryonLiveApi.startSession(productId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tryonLiveKeys.quota }),
  });
}

// Chỉ gọi khi KHÔNG có video để upload (mất kết nối giữa chừng...) - xem tryonLiveApi.real.js
export function useCompleteLiveTryon() {
  return useMutation({
    mutationFn: ({ sessionId, status, actualDurationSeconds }) =>
      tryonLiveApi.completeSession(sessionId, { status, actualDurationSeconds }),
  });
}
