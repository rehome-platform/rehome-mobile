import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEGRADED_STATUS } from "@/constants/withdrawal";
import { degradedApi } from "../api/degradedApi";
import { withdrawalKeys } from "../api/queryKeys";

// KG-16
export function useDegradedCase(id) {
  return useQuery({
    queryKey: withdrawalKeys.degraded(id),
    queryFn: () => degradedApi.getDegradedCase(id),
    enabled: !!id,
  });
}

// Ca đang chờ chọn → dải nhắc ở tab Ký gửi
export function usePendingDegradedCases(enabled = true) {
  return useQuery({
    queryKey: withdrawalKeys.degradedMine(DEGRADED_STATUS.PENDING_DECISION),
    queryFn: () =>
      degradedApi.getMyDegradedCases({
        status: DEGRADED_STATUS.PENDING_DECISION,
      }),
    enabled,
  });
}

// Chọn cách đền / khung Mock: làm mới ca hỏng + sản phẩm ký gửi + ví (tiền đền)
export function useDegradedMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["degraded"] });
      queryClient.invalidateQueries({ queryKey: ["consign"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
