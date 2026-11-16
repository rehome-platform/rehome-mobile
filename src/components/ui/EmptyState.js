import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, textStyles } from "@/theme";

// Màn/khối trống: icon + tiêu đề + mô tả (+ nút tuỳ chọn qua children)
export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
  children,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral,
    marginBottom: spacing.sm,
  },
  title: { ...textStyles.heading, color: colors.text, textAlign: "center" },
  desc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
