import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";

// "Hoa hồng kỳ 1 · 10%" — % lấy từ BE (commissionRate), thiếu thì suy từ commission / giá bán; kỳ chỉ hiện khi BE trả
export function commissionLabel(row) {
  const rate =
    row.commissionRate ?? (row.salePrice ? row.commission / row.salePrice : 0);
  const pct = `${Math.round(rate * 100)}%`;
  return row.termNo ? `Hoa hồng kỳ ${row.termNo} · ${pct}` : `Hoa hồng ${pct}`;
}

// Giá bán − Hoa hồng − Thuế = Vào ví. Dùng ĐÚNG số BE trả (không tự tính lại) — VI-02, VI-03
export function AmountBreakdown({ row, totalLabel = "Vào ví" }) {
  return (
    <View style={styles.wrap}>
      <Line label="Giá bán" value={formatVnd(row.salePrice)} />
      <Line
        label={commissionLabel(row)}
        value={`− ${formatVnd(row.commission)}`}
      />
      {row.tax ? (
        <Line label="Thuế khấu trừ" value={`− ${formatVnd(row.tax)}`} />
      ) : null}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.total}>{formatVnd(row.netAmount)}</Text>
      </View>
    </View>
  );
}

function Line({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  value: { ...textStyles.body, color: colors.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  totalLabel: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  total: { ...textStyles.heading, fontFamily: fonts.bold, color: colors.text },
});
