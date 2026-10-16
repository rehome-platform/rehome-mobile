import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";

// Mỗi kiểu nút: màu nền/viền, màu chữ, màu vòng quay loading
const VARIANTS = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.onPrimary },
    spinner: colors.onPrimary,
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    text: { color: colors.primary },
    spinner: colors.primary,
  },
  text: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.accent },
    spinner: colors.accent,
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading; // đang loading thì không cho bấm lần nữa

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        v.container,
        disabled && styles.disabled, // chỉ nút bị khoá mới mờ; đang loading vẫn giữ màu đậm
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text style={[styles.text, v.text]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
