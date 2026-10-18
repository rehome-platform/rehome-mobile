import { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useBrandOptions,
  useCategoryOptions,
} from "@/features/catalog/hooks/useCatalogOptions";
import { useProducts } from "../hooks/useProducts";
import { countFilters } from "../utils/filters";
import { ProductGrid } from "../components/ProductGrid";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import { FilterSheet } from "../components/FilterSheet";

// BR-02 + BR-03 · Tìm kiếm và bộ lọc (Guest dùng được). Nhận sẵn ?categoryId= nếu có
export default function SearchScreen() {
  const params = useLocalSearchParams();
  const [text, setText] = useState(""); // chữ đang gõ
  const [search, setSearch] = useState(""); // từ khoá đã bấm tìm
  const [filters, setFilters] = useState(() => ({
    categoryId: params.categoryId,
  }));
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const categories = useCategoryOptions();
  const brands = useBrandOptions();

  const filterCount = countFilters(filters);
  const hasCriteria = !!search || filterCount > 0;
  // Chỉ gọi API khi bấm tìm (Enter) hoặc đổi bộ lọc — không gọi theo từng chữ
  const query = useProducts({ search, ...filters }, { enabled: hasCriteria });

  const toTop = () =>
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  const submit = () => {
    setSearch(text.trim());
    toTop();
  };
  const changeFilters = (next) => {
    setFilters(next);
    setSheetOpen(false);
    toTop();
  };
  const clearText = () => {
    setText("");
    inputRef.current?.focus();
  };
  const openSheet = () => {
    Keyboard.dismiss();
    setSheetOpen(true);
  };
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.inputBox}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder="Tìm áo, quần, thương hiệu…"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoFocus
          autoCorrect={false}
          style={styles.input}
        />
        {text ? (
          <Pressable
            onPress={clearText}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xoá chữ"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen padded={false} header={header}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {hasCriteria && query.data ? `${query.data.total} sản phẩm` : ""}
        </Text>
        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.filterBtn,
            filterCount > 0 && styles.filterBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={filterCount > 0 ? colors.onPrimary : colors.text}
          />
          <Text
            style={[
              styles.filterText,
              filterCount > 0 && styles.filterTextActive,
            ]}
          >
            {filterCount > 0 ? `Lọc · ${filterCount}` : "Lọc"}
          </Text>
        </Pressable>
      </View>

      <ActiveFilterChips
        filters={filters}
        categories={categories.data}
        brands={brands.data}
        onChange={changeFilters}
        style={styles.activeChips}
      />

      {hasCriteria ? (
        <ProductGrid
          query={query}
          listRef={listRef}
          onPressItem={(p) => router.push(`/products/${p.id}`)}
          empty={
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy món nào"
              description="Hàng ký gửi là đồ cũ nên mỗi món chỉ có một cái. Thử từ khoá khác, bỏ bớt bộ lọc, hoặc quay lại sau — kho nhập hàng mới mỗi ngày."
            >
              {filterCount > 0 ? (
                <Button
                  title="Xoá hết bộ lọc"
                  onPress={() => changeFilters({})}
                />
              ) : null}
            </EmptyState>
          }
        />
      ) : (
        <EmptyState
          icon="search-outline"
          title="Bạn đang tìm món gì?"
          description="Gõ tên món hoặc thương hiệu rồi bấm tìm trên bàn phím. Có thể lọc theo danh mục, thương hiệu, khoảng giá."
        />
      )}

      {sheetOpen ? (
        <FilterSheet
          initial={filters}
          categories={categories.data}
          brands={brands.data}
          onApply={changeFilters}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </Screen>
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
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  pressed: { opacity: 0.7 },
  inputBox: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  count: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  filterBtn: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...textStyles.body,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  filterTextActive: { fontFamily: fonts.semibold, color: colors.onPrimary },
  activeChips: { paddingBottom: spacing.sm, backgroundColor: colors.surface },
});
