import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Ô tích + nội dung. children: chuỗi, hoặc <Text> có link lồng bên trong (Điều khoản…)
export function Checkbox({
  checked = false,
  onChange,
  children,
  error,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={() => onChange?.(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        hitSlop={8}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            error && !checked && styles.boxError,
          ]}
        >
          {checked ? (
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
          ) : null}
        </View>
        <View style={styles.label}>
          {typeof children === "string" ? (
            <Text style={styles.text}>{children}</Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  box: {
    width: 22,
    height: 22,
    marginTop: 1, // canh giữa ô với dòng chữ đầu tiên
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: radius.input / 3,
    backgroundColor: colors.surface,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  label: { flex: 1 },
  text: { ...textStyles.body, color: colors.text },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
