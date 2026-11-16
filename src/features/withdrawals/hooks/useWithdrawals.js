import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WITHDRAWAL_STATUS } from "@/constants/withdrawal";
import { withdrawalApi } from "../api/withdrawalApi";
import { withdrawalKeys } from "../api/queryKeys";

const APPROVAL_POLL_MS = 30000;

// KG-15. Chờ đến lấy tính bằng ngày → không tự hỏi lại. Riêng lúc CHỜ DUYỆT: BE (11/11) chưa gửi thông báo khi
// địa điểm ký gửi duyệt / từ chối → hỏi lại 30 giây/lần trong lúc đang mở màn
export function useWithdrawal(id) {
  return useQuery({
    queryKey: withdrawalKeys.detail(id),
    queryFn: () => withdrawalApi.getWithdrawal(id),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.status === WITHDRAWAL_STATUS.PENDING_APPROVAL
        ? APPROVAL_POLL_MS
        : false,
  });
}

// Tạo / trả phí / khung Mock: làm mới yêu cầu rút + sản phẩm ký gửi (đổi trạng thái) + ví (phí)
export function useWithdrawalMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["consign"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
