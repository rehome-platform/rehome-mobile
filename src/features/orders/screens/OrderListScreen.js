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
import { ORDER_TABS } from "@/constants/order";
import { useAuthStore } from "@/stores/authStore";
import { useOrders } from "../hooks/useOrders";
import { OrderCard } from "../components/OrderCard";
import { ConfirmReceiptDialog } from "../components/ConfirmReceiptDialog";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");
const CHIPS = ORDER_TABS.map((t) => ({ value: t.key, label: t.label }));

// BR-10 · Đơn hàng của tôi. Mở thẳng một chip: /orders?tab=SHIPPING
export default function OrderListScreen() {
  const params = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [tabKey, setTabKey] = useState(() =>
    ORDER_TABS.some((t) => t.key === params.tab) ? params.tab : "ALL",
  );
  const tab = ORDER_TABS.find((t) => t.key === tabKey);
  const query = useOrders(tab);
  const listRef = useRef(null);
  const [confirmOrder, setConfirmOrder] = useState(null); // đơn đang mở dialog BR-13

  if (!isAuthed) return <Redirect href="/login" />;

  const orders = query.data ?? [];
  const openDetail = (o) => router.push(`/orders/${o.id}`);

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
        icon="receipt-outline"
        title="Chưa có đơn hàng nào"
        description="Đơn bạn đặt sẽ hiện ở đây để theo dõi."
      >
        <Button
          title="Khám phá sản phẩm"
          onPress={() => router.dismissTo("/")}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState icon="file-tray-outline" title="Không có đơn ở mục này" />
    );
  }

  return (
    <Screen
      header={<AppHeader title="Đơn hàng của tôi" onBack={goBack} />}
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
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => openDetail(item)}
            onPay={() =>
              router.push({
                pathname: "/payment",
                params: { orderIds: item.id },
              })
            }
            onTrack={() => router.push(`/orders/${item.id}/tracking`)}
            onConfirm={() => setConfirmOrder(item)}
            onRate={() => router.push(`/orders/${item.id}/rating`)}
            onReturn={() =>
              router.push({
                pathname: "/returns/new",
                params: { orderId: item.id },
              })
            }
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
      {confirmOrder ? (
        <ConfirmReceiptDialog
          order={confirmOrder}
          onClose={() => setConfirmOrder(null)}
        />
      ) : null}
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
