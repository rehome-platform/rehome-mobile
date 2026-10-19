import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { walletApi } from "../api/walletApi";
import { walletKeys } from "../api/queryKeys";
import { matchDirection } from "../utils/txDirection";

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
