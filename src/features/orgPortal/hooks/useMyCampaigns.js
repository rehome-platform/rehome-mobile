import { useQuery } from "@tanstack/react-query";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";

// Mọi chiến dịch của tổ chức đang đăng nhập (đang nhận + đã đóng), đã xếp sẵn
export const useMyCampaigns = () =>
  useQuery({
    queryKey: orgContentKeys.campaigns,
    queryFn: orgContentApi.getMyCampaigns,
  });
