import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConsignTab() {
  return (
    <Screen edges={["top"]}>
      <EmptyState
        icon="cube-outline"
        title="Ký gửi — sắp có"
        description="Gửi đồ tới kho ReHome để bán hộ."
      />
    </Screen>
  );
}
