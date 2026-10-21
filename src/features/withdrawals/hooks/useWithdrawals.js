import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withdrawalApi } from "../api/withdrawalApi";
import { withdrawalKeys } from "../api/queryKeys";

// KG-15. Chờ Member / kho tính bằng ngày → không tự hỏi lại, kéo tải lại là đủ
export function useWithdrawal(id) {
  return useQuery({
    queryKey: withdrawalKeys.detail(id),
    queryFn: () => withdrawalApi.getWithdrawal(id),
    enabled: !!id,
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
