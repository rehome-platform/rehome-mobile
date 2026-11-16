import { tryonApi } from "../api/tryonApi";
import { tryonKeys } from "../api/queryKeys";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// AI-01 · Lượt phối đồ AI còn lại theo gói (GET /tryon/quota). enabled = false cho khách
export function useTryonQuota({ enabled = true } = {}) {
  return useQuery({
    queryKey: tryonKeys.quota,
    queryFn: tryonApi.getQuota,
    staleTime: 0, // lượt đổi liên tục trong ngày
    enabled,
  });
}

// AI-02 tab Gợi ý (API 96)
export function useSuggestions(slot, excludeId) {
  return useQuery({
    queryKey: tryonKeys.suggestions(slot, excludeId),
    queryFn: () =>
      tryonApi.getSuggestions({ slot, excludeProductId: excludeId }),
    enabled: !!slot,
  });
}

// AI phối đồ: món hợp với món đang xem (áo → quần, quần → áo). Đầm đã đủ bộ → không gọi.
// Gemini có thể mất vài giây; lỗi thì màn tự để ô trống như cũ (không chặn người dùng)
export function useOutfitSuggestions(productId, targetSlot) {
  return useQuery({
    queryKey: tryonKeys.outfitSuggestions(productId),
    queryFn: () => tryonApi.getOutfitSuggestions({ productId, targetSlot }),
    enabled: !!productId && !!targetSlot,
    staleTime: 5 * 60 * 1000, // mở lại phòng trong 5 phút không hỏi lại AI
    retry: false,
  });
}

// AI-02 tab Tất cả — cuộn vô hạn; trả { items, total }
export function useSlotProducts(slot, excludeId) {
  return useInfiniteQuery({
    queryKey: tryonKeys.slotProducts(slot, excludeId),
    queryFn: ({ pageParam }) =>
      tryonApi.getSlotProducts({
        slot,
        excludeProductId: excludeId,
        page: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => ({
      items: data.pages
        .flatMap((p) => p.content)
        .filter((p) => p.id !== excludeId), // bản thật API 49 chưa bỏ món đang xem
      total: data.pages[0]?.totalElements ?? 0,
    }),
    enabled: !!slot,
  });
}

// AI-04 / AI-06
export function useTryonImage(id) {
  return useQuery({
    queryKey: tryonKeys.image(id),
    queryFn: () => tryonApi.getTryonImage(id),
    enabled: !!id,
  });
}
// AI-05 · Bộ sưu tập (API 98), mới nhất trước; trả { items, total }
export function useTryonImages() {
  return useInfiniteQuery({
    queryKey: tryonKeys.images,
    queryFn: ({ pageParam }) => tryonApi.getTryonImages({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.content),
      total: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

// AI-06 · Xoá ảnh (API 99) → làm mới bộ sưu tập
export function useDeleteTryonImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => tryonApi.deleteTryonImage(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tryon"] }),
  });
}
