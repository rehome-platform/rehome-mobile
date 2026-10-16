import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";

// ───── hoặc ─────   (không truyền label → chỉ một đường kẻ)
export function Divider({ label, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      {label ? (
        <>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.line} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral,
  },
  label: { ...textStyles.caption, color: colors.textSecondary },
});
