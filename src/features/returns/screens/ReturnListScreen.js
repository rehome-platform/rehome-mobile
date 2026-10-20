import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { RETURN_TABS } from "@/constants/returns";
import { useAuthStore } from "@/stores/authStore";
import { useReturns } from "../hooks/useReturns";
import { ReturnCard } from "../components/ReturnCard";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");
const CHIPS = RETURN_TABS.map((t) => ({ value: t.key, label: t.label }));

// Danh sách yêu cầu trả hàng. Mở thẳng một chip: /returns?tab=ACTION
export default function ReturnListScreen() {
  const params = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [tabKey, setTabKey] = useState(() =>
    RETURN_TABS.some((t) => t.key === params.tab) ? params.tab : "ALL",
  );
  const tab = RETURN_TABS.find((t) => t.key === tabKey);
  const query = useReturns(tab);
  const listRef = useRef(null);

  if (!isAuthed) return <Redirect href="/login" />;

  const changeTab = (key) => {
    setTabKey(key);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  let empty;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => query.refetch()}
        />
      </ErrorBox>
    );
  } else if (tabKey === "ALL") {
    empty = (
      <EmptyState
        icon="return-down-back-outline"
        title="Chưa có yêu cầu trả hàng nào"
        description="Bạn có 3 ngày kể từ lúc nhận hàng để yêu cầu trả, ngay trong chi tiết đơn."
      >
        <Button
          title="Xem đơn hàng của tôi"
          variant="secondary"
          onPress={() => router.replace("/orders")}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState icon="file-tray-outline" title="Không có yêu cầu ở mục này" />
    );
  }

  return (
    <Screen
      header={<AppHeader title="Yêu cầu trả hàng" onBack={goBack} />}
      padded={false}
    >
      <ChipGroup
        horizontal
        options={CHIPS}
        value={tabKey}
        onChange={changeTab}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />
      <FlatList
        ref={listRef}
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <ReturnCard
            item={item}
            onPress={() => router.push(`/returns/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={query.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
});
