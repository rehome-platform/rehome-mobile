import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Nhóm nút chọn. multiple=false: value là 1 giá trị; multiple=true: value là mảng
// horizontal=true: một hàng cuộn ngang (chip danh mục ở trang chủ); contentStyle = lề trong hàng cuộn
export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  horizontal = false,
  error,
  style,
  contentStyle,
}) {
  const isSelected = (v) =>
    multiple ? (value ?? []).includes(v) : value === v;

  const toggle = (v) => {
    if (!multiple) return onChange(v);
    const current = value ?? [];
    onChange(
      current.includes(v) ? current.filter((x) => x !== v) : [...current, v],
    );
  };

  const chips = options.map((opt) => {
    const selected = isSelected(opt.value);
    return (
      <Pressable
        key={opt.value}
        onPress={() => toggle(opt.value)}
        accessibilityRole={multiple ? "checkbox" : "radio"}
        accessibilityState={{ checked: selected }}
        style={({ pressed }) => [
          styles.chip,
          selected && styles.chipSelected,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.text, selected && styles.textSelected]}>
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={[styles.wrap, style]}>
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, styles.noWrap, contentStyle]}
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.row}>{chips}</View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  noWrap: { flexWrap: "nowrap" },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.8 },
  text: { ...textStyles.body, color: colors.text },
  textSelected: { fontFamily: fonts.semibold, color: colors.onPrimary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
