import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Ô tích + nội dung. children: chuỗi, hoặc <Text> có link lồng bên trong (Điều khoản…).
// Không có children → chỉ ô tích (nhớ truyền accessibilityLabel). disabled: mờ, không bấm được
export function Checkbox({
  checked = false,
  onChange,
  children,
  disabled = false,
  accessibilityLabel,
  error,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={() => onChange?.(!checked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={[styles.row, disabled && styles.disabled]}
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
        {children != null ? (
          <View style={styles.label}>
            {typeof children === "string" ? (
              <Text style={styles.text}>{children}</Text>
            ) : (
              children
            )}
          </View>
        ) : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  disabled: { opacity: 0.4 },
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
