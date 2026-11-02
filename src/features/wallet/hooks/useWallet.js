import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { walletApi } from "../api/walletApi";
import { walletKeys } from "../api/queryKeys";
import { matchDirection } from "../utils/txDirection";
import { useState } from "react";
import { TX_STATUS } from "@/constants/wallet";

const nextPage = (last) =>
  last.page + 1 < last.totalPages ? last.page + 1 : undefined;

// API 73. Guest không gọi
export function useWallet() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: walletKeys.summary,
    queryFn: walletApi.getWallet,
    enabled: isAuthed,
  });
}

// API 74. Lọc lại theo dấu trên app — phòng khi BE chưa hỗ trợ tham số direction
export function useTransactions(direction = "ALL") {
  return useInfiniteQuery({
    queryKey: walletKeys.transactions(direction),
    queryFn: ({ pageParam }) =>
      walletApi.getTransactions({ direction, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: (data) =>
      data.pages
        .flatMap((p) => p.content)
        .filter((t) => matchDirection(t, direction)),
  });
}

// API 75
export function useRevenue() {
  return useInfiniteQuery({
    queryKey: walletKeys.revenue,
    queryFn: ({ pageParam }) => walletApi.getRevenue({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: (data) => data.pages.flatMap((p) => p.content),
  });
}
// VI-02: GET /wallet/transactions/{id}. Dòng đã có trong danh sách vừa tải → hiện ngay (placeholder), vẫn hỏi BE
export function useTransaction(id) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["wallet", "transaction", id],
    enabled: !!id,
    queryFn: () => walletApi.getTransaction(id),
    placeholderData: () => {
      for (const [, data] of queryClient.getQueriesData({
        queryKey: ["wallet", "transactions"],
      })) {
        const hit = data?.pages
          ?.flatMap((p) => p.content)
          .find((t) => t.id === id);
        if (hit) return hit;
      }
      return undefined;
    },
  });
}
// ---------- Nhánh 4: rút tiền ----------
const FINAL = [TX_STATUS.SUCCESS, TX_STATUS.FAILED];

export function useWalletConfig() {
  return useQuery({
    queryKey: ["wallet", "config"],
    queryFn: walletApi.getWalletConfig,
  });
}

export function usePayouts() {
  return useInfiniteQuery({
    queryKey: walletKeys.payouts,
    queryFn: ({ pageParam }) => walletApi.getPayouts({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: (data) => data.pages.flatMap((p) => p.content),
  });
}

// VI-05: chưa có kết quả → hỏi lại 2 giây/lần, dừng khi Thành công / Thất bại hoặc sau 60 giây (PHASE4_GUIDE 5.5)
export function usePayout(id) {
  const [startedAt] = useState(() => Date.now());
  return useQuery({
    queryKey: walletKeys.payout(id),
    queryFn: () => walletApi.getPayout(id),
    enabled: !!id,
    refetchInterval: (query) =>
      FINAL.includes(query.state.data?.status) || Date.now() - startedAt > 60000
        ? false
        : 2000,
  });
}

export function useCreatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount) => walletApi.createPayout(amount),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wallet"] }), // số dư, khoá, lịch sử, lượt
  });
}
