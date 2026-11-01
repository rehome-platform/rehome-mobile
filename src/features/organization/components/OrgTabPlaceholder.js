import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// [TẠM] Tab tổ chức chưa làm (N8 chiến dịch, N9 bài viết, N10 tin nhắn + hồ sơ) — thay bằng màn thật khi tới nhánh đó
export function OrgTabPlaceholder({ title, icon, description, footer }) {
  return (
    <Screen
      header={<AppHeader title={title} />}
      footer={footer}
      edges={["top"]}
    >
      <EmptyState icon={icon} title="Đang xây dựng" description={description} />
    </Screen>
  );
}
