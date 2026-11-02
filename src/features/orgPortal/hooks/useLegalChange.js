import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useMyOrganization } from "@/features/organization/hooks/useMyOrganization";
import { loadLegalChangeRecord } from "../utils/legalChangeRecord";
import { resolveLegalChange } from "../utils/legalChange";

export const legalChangeKeys = { mine: ["organization", "legalChange"] };

// Yêu cầu đổi pháp lý gần nhất của tài khoản đang đăng nhập → { data: { ...record, status } | null, isPending }.
// [CHỜ BE GET /api/organizations/me/legal-change-requests] có API thì queryFn gọi API, bỏ bản lưu trên máy
export function useLegalChange() {
  const owner = useAuthStore((s) => s.user?.email);
  const me = useMyOrganization();
  const record = useQuery({
    queryKey: [...legalChangeKeys.mine, owner],
    queryFn: () => loadLegalChangeRecord(owner),
    enabled: !!owner,
  });
  return {
    data: resolveLegalChange(record.data ?? null, me.data),
    isPending: record.isPending,
  };
}
