import { useQuery } from "@tanstack/react-query";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";

// Một chiến dịch của tổ chức (kèm warehouses[].pendingCount)
export const useMyCampaign = (id) =>
  useQuery({
    queryKey: orgContentKeys.campaign(id),
    queryFn: () => orgContentApi.getMyCampaign(id),
    enabled: !!id,
  });
