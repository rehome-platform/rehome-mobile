import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Thẻ chọn một trong nhiều (AU-03: Cá nhân / Tổ chức; OA-01: loại hình tổ chức)
export function RadioCard({
  title,
  description,
  selected = false,
  onPress,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2, // luôn dày 2 → chọn/bỏ chọn không làm thẻ "nhảy" kích thước
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  desc: { ...textStyles.caption, color: colors.textSecondary },
});
