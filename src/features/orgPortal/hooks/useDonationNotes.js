import { useInfiniteQuery } from "@tanstack/react-query";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";

// OC-08 xem lại: note quyên góp đã ghi của một chiến dịch, mới nhất trước (cuộn tải tiếp)
export const useDonationNotes = (campaignId) =>
  useInfiniteQuery({
    queryKey: orgContentKeys.donationNotes(campaignId),
    queryFn: ({ pageParam }) =>
      orgContentApi.getDonationNotes(campaignId, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.content ?? []),
      total: data.pages[0]?.totalElements ?? 0,
    }),
    enabled: !!campaignId,
    retry: (count, e) => e?.code !== "NOTES_NOT_READY" && count < 2,
  });
