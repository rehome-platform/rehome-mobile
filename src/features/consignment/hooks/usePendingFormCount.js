import { useQuery } from "@tanstack/react-query";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { FORM_STATUS } from "@/constants/consignment";

// Số form đang chờ duyệt: hỏi API 16 lọc PENDING, size 1, đọc totalElements
// → không phải tải hết danh sách. Nhiều nơi gọi cùng lúc thì react-query chỉ gửi 1 request
export function usePendingFormCount() {
  return useQuery({
    queryKey: consignKeys.pendingCount(),
    queryFn: () =>
      consignmentApi.getMyForms({
        status: FORM_STATUS.PENDING,
        page: 0,
        size: 1,
      }),
    select: (data) => data.totalElements,
  });
}
