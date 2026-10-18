import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { cartItems, useCart, useRemoveCartItem } from "../hooks/useCart";
import { WarehouseGroup } from "../components/WarehouseGroup";
import { PendingPaymentBanner } from "../components/PendingPaymentBanner";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// Dải thông báo đầu giỏ
function Banner({ icon, children }) {
  return (
    <View style={styles.banner}>
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

// BR-05 · Giỏ hàng (chỉ Member)
export default function CartScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const cart = useCart();
  const remove = useRemoveCartItem();
  // Chỉ nhớ món Member BỎ tích → món mới vào giỏ mặc định được tích; món không khả dụng tự bị loại
  const [excluded, setExcluded] = useState(() => new Set());

  if (!isAuthed) return <Redirect href="/login" />;

  const items = cartItems(cart.data);
  const header = (
    <AppHeader
      title={items.length ? `Giỏ hàng (${items.length})` : "Giỏ hàng"}
      onBack={goBack}
    />
  );

  if (cart.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (cart.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={cart.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => cart.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }
  if (!items.length) {
    return (
      <Screen header={header}>
        <PendingPaymentBanner />
        <EmptyState
          icon="cart-outline"
          title="Giỏ hàng đang trống"
          description="Mỗi món trên ReHome là đồ cũ độc bản đã qua kiểm định. Thêm món bạn thích vào giỏ nhé."
        >
          <Button
            title="Khám phá sản phẩm"
            onPress={() => router.dismissTo("/")}
          />
        </EmptyState>
      </Screen>
    );
  }

  const groups = cart.data.groupedByWarehouse;
  const isSelected = (id) => !excluded.has(id);
  const available = items.filter((i) => !i.unavailableReason);
  const selected = available.filter((i) => isSelected(i.id));
  const unavailableCount = items.length - available.length;
  const total = selected.reduce((sum, i) => sum + i.product.currentPrice, 0);
  // Số đơn = số kho có ít nhất 1 món đang tích (BE tách đơn theo kho)
  const orderCount = groups.filter((g) =>
    g.items.some((i) => !i.unavailableReason && isSelected(i.id)),
  ).length;

  const toggle = (ids, checked) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.delete(id) : next.add(id)));
      return next;
    });

  const confirmRemove = (item) =>
    Alert.alert(
      "Xoá khỏi giỏ?",
      `"${item.product.name}" sẽ bị xoá khỏi giỏ hàng.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () =>
            remove.mutate(item.id, { onError: (e) => showToast(e.message) }),
        },
      ],
    );

  const listHeader = (
    <View style={styles.banners}>
      <PendingPaymentBanner />
      {unavailableCount > 0 ? (
        <Banner icon="alert-circle-outline">
          {`${unavailableCount} món không còn mua được. Các món còn lại vẫn đặt bình thường.`}
        </Banner>
      ) : null}
      {orderCount >= 2 ? (
        <Banner icon="information-circle-outline">
          {`Hàng của bạn ở ${orderCount} kho khác nhau, sẽ tách thành ${orderCount} đơn và tính phí vận chuyển riêng.`}
        </Banner>
      ) : null}
    </View>
  );

  const listFooter = (
    <NoteBox style={styles.note}>
      {"Mỗi món là hàng ký gửi duy nhất, không có số lượng. Thêm vào giỏ chưa giữ chỗ — ai thanh toán trước thì được." +
        (unavailableCount > 0
          ? "\nMón không còn khả dụng vẫn nằm trong giỏ để bạn biết đã mất món nào. Bấm ✕ để xoá."
          : "")}
    </NoteBox>
  );

  const footer = (
    <View style={styles.footer}>
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>Tạm tính {selected.length} món</Text>
        <Text style={styles.sumTotal}>{formatVnd(total)}</Text>
      </View>
      <Text style={styles.sumNote}>
        {orderCount
          ? `Chưa gồm phí vận chuyển của ${orderCount} đơn`
          : "Tích chọn món để đặt hàng"}
      </Text>
      <Button
        title={selected.length ? `Đặt hàng (${selected.length})` : "Đặt hàng"}
        disabled={!selected.length}
        onPress={() =>
          router.push({
            pathname: "/checkout",
            params: { ids: selected.map((i) => i.product.id).join(",") },
          })
        }
      />
    </View>
  );

  return (
    <Screen header={header} footer={footer} padded={false}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.warehouseId}
        renderItem={({ item }) => (
          <WarehouseGroup
            group={item}
            isSelected={isSelected}
            onToggle={toggle}
            onRemove={confirmRemove}
            removingId={remove.isPending ? remove.variables : null}
          />
        )}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={cart.isRefetching}
            onRefresh={cart.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { padding: spacing.lg },
  gap: { height: spacing.lg },
  banners: { gap: spacing.sm, marginBottom: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  bannerText: { flex: 1, ...textStyles.body, color: colors.text },
  note: { marginTop: spacing.lg },
  footer: { gap: spacing.xs },
  sumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sumLabel: { ...textStyles.body, color: colors.textSecondary },
  sumTotal: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  sumNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
