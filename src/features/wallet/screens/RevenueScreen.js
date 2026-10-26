import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { toDate } from "@/features/orders/utils/time";
import { useRevenue } from "../hooks/useWallet";
import { AmountBreakdown } from "../components/AmountBreakdown";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/wallet");

// ‹ Tháng 10 › — không cho sang tháng tương lai. [GIẢ ĐỊNH] lọc trên dữ liệu đã tải theo completedAt
function MonthPicker({ month, onChange }) {
  const isCurrent = month.isSame(dayjs(), "month");
  return (
    <View style={styles.month}>
      <Pressable
        onPress={() => onChange(month.subtract(1, "month"))}
        hitSlop={8}
        accessibilityLabel="Tháng trước"
      >
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.monthText}>Tháng {month.format("M")}</Text>
      <Pressable
        onPress={() => onChange(month.add(1, "month"))}
        disabled={isCurrent}
        hitSlop={8}
        accessibilityLabel="Tháng sau"
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isCurrent ? colors.neutral : colors.text}
        />
      </Pressable>
    </View>
  );
}

// VI-03 · Doanh thu của tôi (đơn bán đã hoàn thành, hoa hồng đã chốt từng đơn)
export default function RevenueScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useRevenue();
  const [month, setMonth] = useState(() => dayjs().startOf("month"));

  if (!isAuthed) return <Redirect href="/login" />;

  const rows = (query.data ?? []).filter((r) =>
    toDate(r.completedAt).isSame(month, "month"),
  );
  const totalSale = rows.reduce((s, r) => s + r.salePrice, 0);
  const totalNet = rows.reduce((s, r) => s + r.netAmount, 0);

  const header = (
    <AppHeader
      title="Doanh thu của tôi"
      onBack={goBack}
      right={<MonthPicker month={month} onChange={setMonth} />}
    />
  );

  const summary = (
    <View style={styles.summary}>
      <View style={styles.sumBox}>
        <Text style={styles.muted}>{rows.length} đơn đã bán</Text>
        <Text style={styles.sumValue}>{formatVnd(totalSale)}</Text>
        <Text style={styles.caption}>tổng giá bán</Text>
      </View>
      <View style={[styles.sumBox, styles.sumBoxStrong]}>
        <Text style={styles.muted}>Bạn nhận</Text>
        <Text style={styles.sumValue}>{formatVnd(totalNet)}</Text>
        <Text style={styles.caption}>sau hoa hồng, thuế</Text>
      </View>
    </View>
  );

  return (
    <Screen header={header} padded={false}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.orderId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.strong} numberOfLines={1}>
                {item.productName ?? "Đơn bán"}
              </Text>
              <Text style={styles.caption}>
                {item.orderNo} · {toDate(item.completedAt).format("DD/MM")}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <AmountBreakdown row={item} totalLabel="Đã vào ví" />
            </View>
          </View>
        )}
        ListHeaderComponent={summary}
        ListEmptyComponent={
          query.isPending ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : query.isError ? (
            <ErrorBox message={query.error.message}>
              <Button
                title="Thử lại"
                variant="secondary"
                onPress={() => query.refetch()}
              />
            </ErrorBox>
          ) : (
            <Text style={styles.empty}>
              Tháng này chưa có đơn bán nào hoàn thành.
            </Text>
          )
        }
        ListFooterComponent={
          rows.length ? (
            <NoteBox style={styles.note}>
              Mỗi đơn chịu mức hoa hồng của kỳ lúc được đặt. Món bán càng sớm
              trong kỳ 1 thì bạn giữ được càng nhiều.
            </NoteBox>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
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
  list: { padding: spacing.lg },
  gap: { height: spacing.md },
  month: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  monthText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  summary: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  sumBox: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  sumBoxStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  sumValue: {
    ...textStyles.heading,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  muted: { ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  cardBody: { padding: spacing.md },
  note: { marginTop: spacing.lg },
  empty: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
