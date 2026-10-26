import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { calcPayout, formatRate } from "@/utils/consignment";

// Giá bán − hoa hồng = tiền Member nhận. rateLabel vd "Hoa hồng kỳ 1"; children = dòng ghi chú dưới cùng
export function PayoutBreakdown({
  title,
  price,
  rate,
  priceLabel = "Giá bán hiện tại",
  rateLabel,
  totalLabel = "Bạn nhận vào ví",
  boxed = false,
  children,
}) {
  const commission = price - calcPayout(price, rate);
  return (
    <View style={[styles.wrap, boxed && styles.boxed]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.label}>{priceLabel}</Text>
        <Text style={styles.value}>{formatVnd(price)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>
          {rateLabel} ({formatRate(rate)})
        </Text>
        <Text style={styles.minus}>− {formatVnd(commission)}</Text>
      </View>
      <View style={[styles.row, styles.total]}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.totalValue}>
          {formatVnd(calcPayout(price, rate))}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  boxed: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  value: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  minus: { ...textStyles.body, color: colors.textSecondary },
  total: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  totalLabel: { flex: 1, ...textStyles.heading, color: colors.text },
  totalValue: { ...textStyles.title, color: colors.primary },
});
