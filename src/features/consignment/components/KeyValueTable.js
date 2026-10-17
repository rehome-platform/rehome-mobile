import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Bảng "nhãn | giá trị" có kẻ dòng (biên nhận KG-06, hộp xác nhận KG-07)
export function KeyValueTable({ rows, bordered = true }) {
  return (
    <View style={bordered && styles.table}>
      {rows.map((row, i) => (
        <View key={row.label} style={[styles.row, i > 0 && styles.divider]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  label: { width: 110, ...textStyles.body, color: colors.textSecondary },
  value: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
