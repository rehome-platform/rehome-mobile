import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import * as pointsApi from "../api/pointsApi";
import { tryonLiveKeys } from "@/features/tryon-live/api/queryKeys";
import { pointsKeys } from "../api/queryKeys";

// GET /points. Guest / tổ chức không gọi (API chỉ cho MEMBER)
export function usePoints() {
  const isMember = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: pointsKeys.summary,
    queryFn: pointsApi.getPoints,
    enabled: isMember,
  });
}

// POST /points/redeem — BE trả luôn số dư mới → ghi thẳng vào cache, không cần tải lại
export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pointsApi.redeemPoints,
    onSuccess: (summary) => {
      queryClient.setQueryData(pointsKeys.summary, summary);
      // Lượt vừa đổi cộng vào quota thử đồ real-time (canStart / bonusCredits) → tải lại cho màn thử đồ
      queryClient.invalidateQueries({ queryKey: tryonLiveKeys.quota });
    },
  });
}
