import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Nút chọn một trong vài mục nằm ngang (Theo tháng / Theo năm; Chưa dùng / Đã dùng / Hết hạn).
// items: [{ key, label }]
export function SegmentTabs({ items, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: spacing.xs,
    gap: spacing.xs,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.input - 4,
  },
  active: { backgroundColor: colors.surface },
  text: { ...textStyles.body, color: colors.textSecondary },
  textActive: { fontFamily: fonts.semibold, color: colors.primary },
});
