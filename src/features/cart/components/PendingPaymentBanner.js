import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatCountdown } from "@/hooks/useCountdown";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useSecondsLeft } from "@/features/orders/hooks/useSecondsLeft";
import { toDate } from "@/features/orders/utils/time";

// Dải "Bạn có n đơn chờ thanh toán — còn mm:ss" ở giỏ (PHASE3_GUIDE 0.4 #11). Hết giờ → tự ẩn
export function PendingPaymentBanner() {
  const orders = useCheckoutStore((s) => s.pendingOrders);
  const deadlineMs = orders.length
    ? Math.min(...orders.map((o) => toDate(o.paymentDeadline).valueOf()))
    : 0;
  const left = useSecondsLeft(deadlineMs);

  if (!orders.length || left === 0) return null;
  return (
    <Pressable
      onPress={() => router.push("/payment")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      <Ionicons name="time-outline" size={20} color={colors.onPrimary} />
      <Text style={styles.text}>
        {`Bạn có ${orders.length} đơn chờ thanh toán — còn ${formatCountdown(left)}`}
      </Text>
      <Text style={styles.link}>Thanh toán ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, ...textStyles.body, color: colors.onPrimary },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
});
