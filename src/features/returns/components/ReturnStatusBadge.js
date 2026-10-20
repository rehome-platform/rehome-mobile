import { StyleSheet, Text } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { RETURN_STATUS as R, RETURN_STATUS_LABEL } from "@/constants/returns";

// Cần Member làm / đã có kết quả tiền → nhãn đặc; còn lại → nhãn viền; Đã huỷ → mờ
const FILLED = [R.APPROVED, R.INVALID, R.VALID, R.LOST];

export function ReturnStatusBadge({ status }) {
  return (
    <Text
      style={[
        styles.badge,
        FILLED.includes(status) ? styles.filled : styles.outline,
        status === R.CANCELLED && styles.cancelled,
      ]}
    >
      {(RETURN_STATUS_LABEL[status] ?? status).toUpperCase()}
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
