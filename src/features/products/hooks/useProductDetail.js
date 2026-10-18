import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/productsApi";
import { shopKeys } from "../api/queryKeys";

// Tìm món trong các danh sách đã tải (trang chủ, tìm kiếm) → hiện ngay trong lúc chờ chi tiết (PHASE3_GUIDE 5.2b #1)
function findInLists(queryClient, id) {
  const lists = queryClient.getQueriesData({ queryKey: ["products", "list"] });
  for (const [, data] of lists) {
    const hit = data?.pages?.flatMap((p) => p.content).find((p) => p.id === id);
    if (hit) {
      return {
        ...hit,
        photos: hit.thumbnailUrl ? [{ url: hit.thumbnailUrl }] : [],
      };
    }
  }
  return undefined;
}

// BR-04. Khi đang hiện tạm dữ liệu thẻ: isPlaceholderData = true, chưa có status
export function useProductDetail(id) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: shopKeys.product(id),
    queryFn: () => productsApi.getProduct(id),
    placeholderData: () => findInLists(queryClient, id),
    enabled: !!id,
  });
}

const SIMILAR_LIMIT = 6;

// "Sản phẩm tương tự" = món cùng danh mục đang bán, bỏ chính nó (PHASE3_GUIDE 0.4 #4)
export function useSimilarProducts(categoryId, excludeId) {
  return useQuery({
    queryKey: shopKeys.similar(categoryId, excludeId),
    queryFn: () =>
      productsApi.getProducts({ categoryId, page: 0, size: SIMILAR_LIMIT + 1 }),
    select: (page) =>
      page.content.filter((p) => p.id !== excludeId).slice(0, SIMILAR_LIMIT),
    enabled: !!categoryId,
  });
}
