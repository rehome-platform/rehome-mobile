import { useQuery } from "@tanstack/react-query";
import { organizationApi } from "../api/organizationApi";

// Loại hình + phạm vi hoạt động (GET /api/organizations/options) — gần như không đổi → tải 1 lần mỗi phiên
export const useOrgOptions = () =>
  useQuery({
    queryKey: ["organization", "options"],
    queryFn: organizationApi.getOrgOptions,
    staleTime: Infinity,
  });
