import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { PRODUCT_VIEW } from "@/constants/consignment";
import { getProductView, PRODUCT_VIEW_ORDER } from "@/utils/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { ProductCard } from "./ProductCard";

// Chip lọc → nhóm trạng thái hiển thị. "Chờ cuối kỳ" gồm cả "Chờ chốt giá" (đều đang xử lý cuối kỳ)
const FILTERS = [
  { value: "ALL", label: "Tất cả", views: null },
  { value: "SELLING", label: "Đang bán", views: [PRODUCT_VIEW.SELLING] },
  {
    value: "END_OF_TERM",
    label: "Chờ cuối kỳ",
    views: [PRODUCT_VIEW.AWAITING_DECISION, PRODUCT_VIEW.REPRICING],
  },
  { value: "ENDED", label: "Kết thúc", views: [PRODUCT_VIEW.ENDED] },
];

export function ProductListSection() {
  const [filter, setFilter] = useState("ALL");

  // Phase 2 tạm lấy 1 trang 50 sản phẩm, lọc + đếm ở app [CHỜ BE lọc theo trạng thái]
  const query = useQuery({
    queryKey: consignKeys.products(),
    queryFn: () => consignmentApi.getMyProducts({ page: 0, size: 50 }),
  });

  // Gắn trạng thái hiển thị + sắp xếp "việc cần làm" lên đầu
  const all = useMemo(
    () =>
      (query.data?.content ?? [])
        .map((p) => ({ ...p, view: getProductView(p) }))
        .sort(
          (a, b) =>
            PRODUCT_VIEW_ORDER.indexOf(a.view) -
            PRODUCT_VIEW_ORDER.indexOf(b.view),
        ),
    [query.data],
  );

  const count = (views) => all.filter((p) => views.includes(p.view)).length;
  const summary = [
    { value: "SELLING", label: "Đang bán", n: count([PRODUCT_VIEW.SELLING]) },
    {
      value: "HAS_ORDER",
      label: "Đã có đơn",
      n: count([PRODUCT_VIEW.HAS_ORDER]),
    },
    {
      value: "END_OF_TERM",
      label: "Chờ cuối kỳ",
      n: count([PRODUCT_VIEW.AWAITING_DECISION, PRODUCT_VIEW.REPRICING]),
    },
  ];

  const views = FILTERS.find((f) => f.value === filter)?.views;
  const shown = views ? all.filter((p) => views.includes(p.view)) : all;

  if (query.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      {all.length ? (
        <View style={styles.summary}>
          {summary.map((s, i) => (
            <Pressable
              key={s.value}
              // "Đã có đơn" không có chip riêng → bấm vào chỉ xem "Tất cả"
              onPress={() =>
                setFilter(
                  FILTERS.some((f) => f.value === s.value) ? s.value : "ALL",
                )
              }
              style={[styles.summaryItem, i > 0 && styles.summaryDivider]}
              accessibilityRole="button"
            >
              <Text style={styles.summaryNumber}>{s.n}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
    </View>
  );

  return (
    <FlatList
      data={shown}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => router.push(`/my-products/${item.id}`)}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        filter === "ALL" ? (
          <EmptyState
            icon="pricetags-outline"
            title="Chưa có sản phẩm ký gửi"
            description="Món đồ lên đây sau khi bạn xác nhận biên nhận tại kho."
          />
        ) : (
          <Text style={styles.emptyFilter}>
            Không có sản phẩm nào ở trạng thái này.
          </Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={query.refetch}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.md },
  summary: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: colors.neutral },
  summaryNumber: { ...textStyles.title, color: colors.text },
  summaryLabel: { ...textStyles.caption, color: colors.textSecondary },
  gap: { height: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  padded: { padding: spacing.lg },
  emptyFilter: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
