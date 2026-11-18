import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { colors } from "@/theme";
import { refreshActive } from "@/lib/query/refresh";

// Kéo xuống để tải lại cho màn tự dựng FlatList / ScrollView (không qua Screen onRefresh — lồng 2 vùng cuộn sẽ lỗi).
// Dùng: const refreshControl = usePullToRefresh();  <FlatList refreshControl={refreshControl} … />
// Gọi ở đầu component (trước mọi return sớm — luật hook). Vòng xoay chỉ hiện khi người dùng kéo
export function usePullToRefresh(onRefresh = refreshActive) {
  const [pulling, setPulling] = useState(false);
  const handle = useCallback(async () => {
    setPulling(true);
    try {
      await onRefresh();
    } catch {
      // lỗi tải lại do từng màn tự hiện
    } finally {
      setPulling(false);
    }
  }, [onRefresh]);
  return (
    <RefreshControl
      refreshing={pulling}
      onRefresh={handle}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );
}
