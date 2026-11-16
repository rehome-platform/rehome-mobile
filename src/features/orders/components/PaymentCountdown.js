import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatCountdown } from "@/hooks/useCountdown";

const TOTAL_SECONDS = 15 * 60; // hạn thanh toán của BE (app.order.payment-deadline-minutes)

// Khối đếm ngược lớn "14:32" + thanh còn lại. Còn ≤ 1 phút → đổi màu đỏ
export function PaymentCountdown({ seconds }) {
  const ratio = Math.max(0, Math.min(1, seconds / TOTAL_SECONDS));
  const urgent = seconds <= 60;
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <Text style={styles.label}>CÒN LẠI ĐỂ THANH TOÁN</Text>
      <Text style={[styles.time, urgent && styles.urgent]}>
        {formatCountdown(seconds)}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%` },
            urgent && styles.fillUrgent,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.neutral,
  },
  label: { ...textStyles.label, color: colors.textSecondary },
  time: {
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 56,
    color: colors.text,
  },
  urgent: { color: colors.error },
  track: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.primary },
  fillUrgent: { backgroundColor: colors.error },
});
