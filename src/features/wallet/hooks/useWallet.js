import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
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
// VI-02: chưa có GET /wallet/transactions/{id} [CHỜ BE câu 13] → tìm trong các danh sách đã tải;
// không thấy (mở bằng link) → tải trang đầu để tìm
export function useTransaction(id) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["wallet", "transaction", id],
    enabled: !!id,
    queryFn: async () => {
      for (const [, data] of queryClient.getQueriesData({
        queryKey: ["wallet", "transactions"],
      })) {
        const hit = data?.pages
          ?.flatMap((p) => p.content)
          .find((t) => t.id === id);
        if (hit) return hit;
      }
      const page = await walletApi.getTransactions({ page: 0, size: 100 });
      const hit = page.content.find((t) => t.id === id);
      if (!hit)
        throw new ApiError({
          status: 404,
          code: "HTTP_404",
          message: "Không tìm thấy giao dịch.",
        });
      return hit;
    },
  });
}
