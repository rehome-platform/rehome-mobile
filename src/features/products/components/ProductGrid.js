import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ProductCard } from "./ProductCard";

// Lưới 2 cột cuộn vô hạn. query = kết quả useProducts; header cuộn theo lưới; empty = khi không có món nào
export function ProductGrid({ query, header, empty, onPressItem, listRef }) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2; // hàng lẻ món vẫn giữ nửa màn hình
  const items = query.data?.items ?? [];

  // Lỗi tải trang sau → dừng tự tải, chờ bấm "Thử lại" (tránh gọi lặp khi mất mạng)
  const onEndReached = () => {
    if (
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      !query.isFetchNextPageError
    ) {
      query.fetchNextPage();
    }
  };

  let emptyView = empty;
  if (query.isPending) {
    emptyView = (
      <ActivityIndicator style={styles.loading} color={colors.primary} />
    );
  } else if (query.isError) {
    emptyView = (
      <ErrorBox message={query.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => query.refetch()}
        />
      </ErrorBox>
    );
  }

  let footer = null;
  if (query.isFetchingNextPage) {
    footer = <ActivityIndicator style={styles.footer} color={colors.primary} />;
  } else if (query.isFetchNextPageError) {
    footer = (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Chưa tải thêm được.</Text>
        <Button
          title="Thử lại"
          variant="text"
          onPress={() => query.fetchNextPage()}
        />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          style={{ width: cardWidth }}
          onPress={() => onPressItem(item)}
        />
      )}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyView}
      ListFooterComponent={footer}
      contentContainerStyle={styles.list}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={query.refetch}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.lg },
  loading: { marginTop: spacing.xxl },
  footer: { alignItems: "center", paddingVertical: spacing.md },
  footerText: { ...textStyles.caption, color: colors.textSecondary },
});
