import { StyleSheet, Text } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { ORDER_STATUS as S, ORDER_STATUS_LABEL } from "@/constants/order";

// Đơn cần Member làm gì / đang trên đường → nhãn đặc; còn lại → nhãn viền; Đã huỷ → mờ
const FILLED = [S.PENDING_PAYMENT, S.SHIPPING, S.DELIVERED];

export function OrderStatusBadge({ status }) {
  const filled = FILLED.includes(status);
  return (
    <Text
      style={[
        styles.badge,
        filled ? styles.filled : styles.outline,
        status === S.CANCELLED && styles.cancelled,
      ]}
    >
      {(ORDER_STATUS_LABEL[status] ?? status).toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
  },
  filled: {
    backgroundColor: colors.text,
    borderColor: colors.text,
    color: colors.surface,
  },
  outline: { borderColor: colors.text, color: colors.text },
  cancelled: { borderColor: colors.neutral, color: colors.textSecondary },
});
