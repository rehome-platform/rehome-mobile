import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CommunityTab() {
  return (
    <Screen edges={["top"]}>
      <EmptyState
        icon="people-outline"
        title="Cộng đồng — sắp có"
        description="Chiến dịch quyên góp của các tổ chức đã xác minh sẽ có ở đây."
      />
    </Screen>
  );
}
