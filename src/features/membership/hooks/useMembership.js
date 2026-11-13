import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import * as membershipApi from "../api/membershipApi";
import { membershipKeys } from "../api/queryKeys";

const nextPage = (last) =>
  last.page + 1 < last.totalPages ? last.page + 1 : undefined;

// M-01: khách cũng xem được
export function usePlans() {
  return useQuery({
    queryKey: membershipKeys.plans,
    queryFn: membershipApi.getPlans,
  });
}

// M-01 / M-02 / M-03. Khách không gọi (API cần đăng nhập)
export function useMyMembership(options = {}) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: membershipKeys.me,
    queryFn: membershipApi.getMyMembership,
    enabled: isAuthed,
    ...options,
  });
}

export function usePurchaseHistory() {
  return useInfiniteQuery({
    queryKey: membershipKeys.history,
    queryFn: ({ pageParam }) => membershipApi.getHistory({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: (data) => data.pages.flatMap((p) => p.content ?? []),
  });
}

// M-07: mã dùng được cho lần đặt hàng này (đổi món / đổi địa chỉ → hỏi lại)
export function useApplicableVouchers(productIds, shippingAddressId) {
  return useQuery({
    queryKey: ["vouchers", "applicable", productIds.join(","), shippingAddressId],
    queryFn: () =>
      membershipApi.getApplicableVouchers({ productIds, shippingAddressId }),
    enabled: productIds.length > 0 && !!shippingAddressId,
  });
}

// M-04: một tab một trạng thái; trả { items, total }
export function useMyVouchers(status) {
  return useInfiniteQuery({
    queryKey: membershipKeys.vouchers(status),
    queryFn: ({ pageParam }) =>
      membershipApi.getMyVouchers({ status, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.content ?? []),
      total: data.pages[0]?.totalElements ?? 0,
    }),
  });
}
