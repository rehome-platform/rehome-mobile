import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteBox } from "@/components/ui/NoteBox";
import { useCategoryOptions } from "@/features/catalog/hooks/useCatalogOptions";
import { useProducts } from "../hooks/useProducts";
import { ProductGrid } from "../components/ProductGrid";

const ALL = "ALL";

// BR-01 · Trang chủ Mua sắm (Guest xem được)
export default function ShopHomeScreen() {
  const [categoryId, setCategoryId] = useState(ALL);
  const [showNote, setShowNote] = useState(true); // ẩn trong lúc app còn mở; mở lại app thì hiện lại
  const listRef = useRef(null);
  const categories = useCategoryOptions();
  const query = useProducts({
    categoryId: categoryId === ALL ? undefined : categoryId,
  });

  const chips = [{ value: ALL, label: "Tất cả" }, ...(categories.data ?? [])];

  const onChangeCategory = (id) => {
    setCategoryId(id);
    listRef.current?.scrollToOffset({ offset: 0, animated: false }); // danh sách mới → về đầu
  };

  const header = (
    <View style={styles.listHeader}>
      {showNote ? (
        <NoteBox>
          <View style={styles.noteRow}>
            <Text style={styles.noteText}>
              Mọi món trên ReHome đều đã qua kiểm định tại kho. Mỗi món là duy
              nhất — bán rồi là hết.
            </Text>
            <Pressable
              onPress={() => setShowNote(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Ẩn ghi chú"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </NoteBox>
      ) : null}
      <Text style={styles.sectionTitle}>Mới lên sàn</Text>
    </View>
  );

  return (
    <Screen edges={["top"]} padded={false} header={<ShopHeader />}>
      <ChipGroup
        horizontal
        options={chips}
        value={categoryId}
        onChange={onChangeCategory}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />
      <ProductGrid
        query={query}
        listRef={listRef}
        header={header}
        onPressItem={(p) => router.push(`/products/${p.id}`)}
        empty={
          <EmptyState
            icon="bag-handle-outline"
            title={
              categoryId === ALL
                ? "Chưa có món nào lên sàn"
                : "Danh mục này chưa có món nào"
            }
            description="Kho nhập hàng mới mỗi ngày, quay lại sau nhé."
          />
        }
      />
    </Screen>
  );
}

// Ô tìm kiếm "giả": bấm là sang màn tìm kiếm (bàn phím mở sẵn ở đó)
function ShopHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>ReHome</Text>
      <Pressable
        onPress={() => router.push("/search")}
        accessibilityRole="search"
        style={({ pressed }) => [styles.search, pressed && styles.pressed]}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <Text style={styles.searchText} numberOfLines={1}>
          Tìm áo, quần, thương hiệu…
        </Text>
      </Pressable>
      {/* Nút giỏ hàng + badge: thêm ở nhánh feature/cart-address */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  logo: { ...textStyles.title, color: colors.primary },
  search: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  searchText: { ...textStyles.body, color: colors.textSecondary, flex: 1 },
  pressed: { opacity: 0.7 },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  listHeader: { gap: spacing.md, marginBottom: spacing.md },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  noteText: { ...textStyles.body, color: colors.textSecondary, flex: 1 },
  sectionTitle: { ...textStyles.heading, color: colors.text },
});
