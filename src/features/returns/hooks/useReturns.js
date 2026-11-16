import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { returnsApi } from "../api/returnsApi";
import { returnKeys } from "../api/queryKeys";

export const RETURN_PAGE_SIZE = 10;

// Danh sách yêu cầu trả theo chip (tab = phần tử của RETURN_TABS), cuộn vô hạn, mới nhất trước
export function useReturns(tab) {
  return useInfiniteQuery({
    queryKey: returnKeys.list(tab.key),
    queryFn: ({ pageParam }) =>
      returnsApi.getReturns({
        statuses: tab.statuses,
        page: pageParam,
        size: RETURN_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.content),
  });
}

// RT-02. Chờ kho / GHN tính bằng ngày → không tự hỏi lại, chỉ kéo tải lại + khi quay lại màn
export function useReturn(id) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: () => returnsApi.getReturn(id),
    enabled: !!id,
  });
}

// Số yêu cầu của một chip (badge "n cần bạn làm" ở tab Cá nhân). [CHỜ BE] số đếm riêng — tạm lấy totalElements
export function useReturnCount(tab) {
  return useQuery({
    queryKey: [...returnKeys.list(tab.key), "count"],
    queryFn: () =>
      returnsApi.getReturns({ statuses: tab.statuses, page: 0, size: 1 }),
    select: (page) => page.totalElements,
  });
}

// Gửi / bàn giao / chọn cách nhận / khung Mock: làm mới yêu cầu trả + đơn (dòng ở BR-11) + ví (hoàn tiền)
export function useReturnMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
