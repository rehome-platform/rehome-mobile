import { StyleSheet, Text } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";

// Nhãn bắt buộc trên mọi ảnh thử đồ (AI-04, AI-06)
export function AiBadge({ style }) {
  return <Text style={[styles.badge, style]}>ẢNH DỰNG BẰNG AI</Text>;
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.text,
  },
});
