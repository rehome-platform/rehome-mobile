import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ShopTab() {
  return (
    <Screen edges={["top"]}>
      <EmptyState
        icon="bag-handle-outline"
        title="Mua sắm — sắp có"
        description="Danh mục đồ đã kiểm định sẽ có ở đây."
      />
    </Screen>
  );
}
