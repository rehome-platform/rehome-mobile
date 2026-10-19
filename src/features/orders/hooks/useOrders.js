import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ordersApi } from "../api/ordersApi";
import { orderKeys } from "../api/queryKeys";

export const ORDER_PAGE_SIZE = 10;

// BR-10: đơn theo chip (tab = phần tử của ORDER_TABS), cuộn vô hạn, mới nhất trước
export function useOrders(tab) {
  return useInfiniteQuery({
    queryKey: orderKeys.list(tab.key),
    queryFn: ({ pageParam }) =>
      ordersApi.getOrders({
        statuses: tab.statuses,
        page: pageParam,
        size: ORDER_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.content),
  });
}

// BR-11
export function useOrder(id) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  });
}

// Huỷ / xác nhận / đánh giá / khung Mock: xong thì làm mới MỌI thứ liên quan tới đơn + sàn (món về / rời sàn)
export function useOrderMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
// Số đơn của một chip (badge "3 đang giao" ở tab Cá nhân). [CHỜ BE] số đếm riêng — tạm lấy totalElements trang đầu
export function useOrderCount(tab) {
  return useQuery({
    queryKey: [...orderKeys.list(tab.key), "count"],
    queryFn: () =>
      ordersApi.getOrders({ statuses: tab.statuses, page: 0, size: 1 }),
    select: (page) => page.totalElements,
  });
}
