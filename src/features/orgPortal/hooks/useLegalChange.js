import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { useMyOrganization } from "@/features/organization/hooks/useMyOrganization";
import { loadLegalChangeRecord } from "../utils/legalChangeRecord";
import { resolveLegalChange } from "../utils/legalChange";

export const legalChangeKeys = { mine: ["organization", "legalChange"] };

// Yêu cầu đổi pháp lý gần nhất của tài khoản đang đăng nhập → { data: { ...yêu cầu, status } | null, isPending }.
// Trạng thái, lý do từ chối, ngày duyệt lấy từ BE (GET /me/legal-change-requests/latest — đổi máy / cài lại app
// vẫn đúng). Bản lưu trên máy chỉ còn bổ sung legalNameDocCount (BE không lưu: bao nhiêu tệp đầu thuộc mục
// tên pháp lý — để "Gửi lại yêu cầu" tách đúng giấy tờ về 2 mục), và làm dự phòng khi gọi BE lỗi / bản mock
async function loadLatest(owner) {
  const [server, local] = await Promise.all([
    organizationApi.getLatestLegalChange().catch(() => undefined), // undefined = lỗi mạng → dùng bản trên máy
    loadLegalChangeRecord(owner),
  ]);
  if (server === undefined) return { record: local, fromServer: false };
  if (server === null) return { record: local, fromServer: false }; // BE chưa có yêu cầu (vd. mock)
  const sameRequest = local && local.id === server.id;
  return {
    record: {
      ...server,
      legalNameDocCount: sameRequest ? local.legalNameDocCount : undefined,
    },
    fromServer: true,
  };
}

export function useLegalChange() {
  const owner = useAuthStore((s) => s.user?.email);
  const me = useMyOrganization();
  const query = useQuery({
    queryKey: [...legalChangeKeys.mine, owner],
    queryFn: () => loadLatest(owner),
    enabled: !!owner,
  });
  const { record = null, fromServer = false } = query.data ?? {};
  return {
    // Từ BE: trạng thái đã đúng. Bản trên máy: "Đã duyệt" vẫn phải suy ra từ hồ sơ đã mang thông tin mới
    data: fromServer ? record : resolveLegalChange(record, me.data),
    isPending: query.isPending,
  };
}
