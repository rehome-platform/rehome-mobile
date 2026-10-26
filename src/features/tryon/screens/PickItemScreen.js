import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { TRYON_SLOT_LABEL } from "@/constants/tryon";
import { ProductCard } from "@/features/products/components/ProductCard";
import { useProductDetail } from "@/features/products/hooks/useProductDetail";
import { useSlotProducts, useSuggestions } from "../hooks/useTryon";
import { useTryonDraftStore } from "../store/tryonDraftStore";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// AI-02 · Chọn món còn thiếu (/tryon/pick?slot=&excludeId=)
export default function PickItemScreen() {
  const { slot, excludeId } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const base = useProductDetail(excludeId);
  const suggest = useSuggestions(slot, excludeId);
  const all = useSlotProducts(slot, excludeId);
  const pick = useTryonDraftStore((s) => s.pick);
  const [tab, setTab] = useState("SUGGEST");
  const [selected, setSelected] = useState(null);
  const label = TRYON_SLOT_LABEL[slot]?.toLowerCase() ?? "món";

  const suggestions = suggest.data ?? [];
  const noSuggestion = suggest.isSuccess && suggestions.length === 0;

  // Gợi ý rỗng → tự mở tab Tất cả (PHASE6_GUIDE AI-02)
  useEffect(() => {
    if (noSuggestion) setTab("ALL");
  }, [noSuggestion]);

  const chips = [
    { value: "SUGGEST", label: `Gợi ý · ${suggestions.length}` },
    { value: "ALL", label: `Tất cả ${label} · ${all.data?.total ?? 0}` },
  ];
  const query = tab === "SUGGEST" ? suggest : all;
  const items = tab === "SUGGEST" ? suggestions : (all.data?.items ?? []);

  const confirm = () => {
    pick(selected);
    goBack();
  };

  let empty = null;
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
        icon="shirt-outline"
        title={`Chưa có ${label} nào đang bán`}
      />
    );
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      {tab === "SUGGEST" ? (
        <Text style={styles.caption}>
          Hệ thống chọn theo tông màu và kiểu dáng hợp với món bạn đang xem. Bạn
          vẫn đổi sang tab Tất cả để tự chọn.
        </Text>
      ) : noSuggestion ? (
        <NoteBox>
          {`Chưa có món nào hợp tông để gợi ý — hàng ký gửi là đồ cũ nên không phải lúc nào cũng có đủ. Dưới đây là toàn bộ ${label} đang bán, bạn tự chọn nhé.`}
        </NoteBox>
      ) : null}
    </View>
  );

  return (
    <Screen
      header={<AppHeader title={`Chọn ${label}`} onBack={goBack} />}
      padded={false}
      footer={
        <Button
          title={
            selected ? `Chọn ${selected.name}` : "Chọn một món để tiếp tục"
          }
          disabled={!selected}
          onPress={confirm}
        />
      }
    >
      {base.data ? (
        <View style={styles.base}>
          <View style={styles.baseThumb}>
            {base.data.thumbnailUrl ? (
              <Image
                source={{ uri: base.data.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>
          <View style={styles.flex}>
            <Text style={styles.caption}>Ghép với</Text>
            <Text style={styles.strong} numberOfLines={1}>
              {base.data.name}
              {base.data.brandName ? ` · ${base.data.brandName}` : ""}
            </Text>
          </View>
        </View>
      ) : null}

      <ChipGroup
        horizontal
        options={chips}
        value={tab}
        onChange={setTab}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />

      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <View
            style={[
              styles.cell,
              { width: cardWidth },
              selected?.id === item.id && styles.cellSelected,
            ]}
          >
            <ProductCard
              product={item}
              onPress={() =>
                setSelected(selected?.id === item.id ? null : item)
              }
            />
          </View>
        )}
        onEndReached={() => {
          if (tab === "ALL" && all.hasNextPage && !all.isFetchingNextPage)
            all.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          tab === "ALL" && all.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.neutral,
  },
  baseThumb: {
    width: 44,
    height: 44,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  headerBlock: { marginBottom: spacing.md },
  list: { flexGrow: 1, padding: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.md },
  cell: {
    padding: spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: radius.input,
  },
  cellSelected: { borderColor: colors.primary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
