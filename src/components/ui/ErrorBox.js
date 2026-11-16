import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Khung lỗi chung của form (lỗi từ server, mất mạng…). Không có message/children → không hiện gì
export function ErrorBox({ message, children, style }) {
  if (!message && !children) return null;
  return (
    <View style={[styles.box, style]} accessibilityLiveRegion="polite">
      {message ? <Text style={styles.title}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
