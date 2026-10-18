import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { priceLabel } from "../utils/filters";

const labelOf = (options, value) =>
  options?.find((o) => o.value === value)?.label ?? "…";

// Chip bộ lọc đang bật: "Áo khoác ✕", "100.000 – 500.000 đ ✕". Bấm để bỏ riêng bộ lọc đó
export function ActiveFilterChips({
  filters,
  categories,
  brands,
  onChange,
  style,
}) {
  const chips = [
    filters.categoryId && {
      key: "category",
      label: labelOf(categories, filters.categoryId),
      clear: { categoryId: undefined },
    },
    filters.brandId && {
      key: "brand",
      label: labelOf(brands, filters.brandId),
      clear: { brandId: undefined },
    },
    (filters.priceMin != null || filters.priceMax != null) && {
      key: "price",
      label: priceLabel(filters.priceMin, filters.priceMax),
      clear: { priceMin: undefined, priceMax: undefined },
    },
  ].filter(Boolean);

  if (!chips.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.row}
    >
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onChange({ ...filters, ...c.clear })}
          accessibilityRole="button"
          accessibilityLabel={`Bỏ lọc ${c.label}`}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.text}>{c.label}</Text>
          <Ionicons name="close" size={14} color={colors.text} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 }, // ScrollView ngang mặc định giãn hết chiều cao còn lại
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.7 },
  text: { ...textStyles.body, color: colors.text },
});
