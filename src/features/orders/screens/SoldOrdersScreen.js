import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ORDER_STATUS } from "@/constants/order";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { useSoldOrders } from "../hooks/useOrders";
import { OrderStatusBadge } from "../components/OrderStatusBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");
const pct = (rate) => `${Math.round(Number(rate) * 100)}%`;

// Dòng cuối thẻ: đã vào ví / dự kiến / huỷ
function payoutText(o) {
  if (o.status === ORDER_STATUS.CANCELLED) return "Đơn đã huỷ — không có tiền";
  if (o.paidOut)
    return `Đã vào ví${o.completedAt ? ` ${dayjs(o.completedAt).format("DD/MM")}` : ""}`;
  return "Dự kiến — vào ví khi hết hạn trả hàng";
}

function SoldOrderCard({ order: o }) {
  const cancelled = o.status === ORDER_STATUS.CANCELLED;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.code}>{o.orderNo}</Text>
          <Text style={styles.muted}>
            Đặt {dayjs(o.createdAt).format("DD/MM/YYYY")}
            {o.warehouseName ? ` · ${o.warehouseName}` : ""}
          </Text>
        </View>
        <OrderStatusBadge status={o.status} />
      </View>

      {o.items.map((it) => (
        <Pressable
          key={it.productId}
          onPress={() => router.push(`/my-products/${it.productId}`)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.thumb}>
            {it.thumbnailUrl ? (
              <Image
                source={{ uri: it.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={2}>
              {it.productName}
            </Text>
            <Text style={styles.muted}>
              Giá bán {formatVnd(it.salePrice)}
              {it.termApplied ? ` · kỳ ${it.termApplied}` : ""}
              {it.commissionRate != null
                ? ` · hoa hồng ${pct(it.commissionRate)}`
                : ""}
            </Text>
          </View>
        </Pressable>
      ))}

      <View style={styles.foot}>
        <Text style={[styles.muted, o.paidOut && styles.paid]}>
          {payoutText(o)}
        </Text>
        {!cancelled ? (
          <Text style={styles.net}>Bạn nhận {formatVnd(o.netAmount)}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Đơn đã bán: đơn có món mình ký gửi (GET /orders/sold) — tiền nhận sau hoa hồng, đã vào ví hay còn dự kiến.
// Bấm một món → trang quản lý món ký gửi
export default function SoldOrdersScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useSoldOrders();

  if (!isAuthed) return <Redirect href="/login" />;

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
  } else {
    empty = (
      <EmptyState
        icon="pricetags-outline"
        title="Chưa có món nào được bán"
        description="Khi có người mua món bạn ký gửi, đơn sẽ hiện ở đây cùng số tiền bạn nhận."
      />
    );
  }

  return (
    <Screen
      header={<AppHeader title="Đơn đã bán" onBack={goBack} />}
      padded={false}
    >
      <FlatList
        data={query.data ?? []}
        keyExtractor={(o) => o.orderId}
        renderItem={({ item }) => <SoldOrderCard order={item} />}
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
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  code: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: {
    width: 48,
    height: 48,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  name: { ...textStyles.body, color: colors.text },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  paid: { fontFamily: fonts.semibold, color: colors.primary },
  net: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
});
