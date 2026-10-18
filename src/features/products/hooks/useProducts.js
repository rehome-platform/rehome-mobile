import { useInfiniteQuery } from "@tanstack/react-query";
import { productsApi } from "../api/productsApi";
import { shopKeys } from "../api/queryKeys";
import { cleanFilters } from "../utils/filters";

export const PAGE_SIZE = 20;

// Danh sách món trên sàn, cuộn vô hạn. Trang bắt đầu từ 0 như BE.
// data = { items, total }: gộp các trang, bỏ món trùng (có món mới lên sàn giữa 2 lần tải → trang sau bị lệch 1 món)
export function useProducts(filters) {
  const clean = cleanFilters(filters);
  return useInfiniteQuery({
    queryKey: shopKeys.products(clean),
    queryFn: ({ pageParam }) =>
      productsApi.getProducts({ ...clean, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => {
      const seen = new Set();
      const items = data.pages
        .flatMap((p) => p.content)
        .filter((p) => !seen.has(p.id) && seen.add(p.id));
      return { items, total: data.pages[0]?.totalElements ?? 0 };
    },
  });
}
