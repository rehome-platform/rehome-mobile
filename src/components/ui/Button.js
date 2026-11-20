import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  // Hành động lùi / huỷ (Huỷ đơn…): viền xám, chữ thường — không lẫn với hành động chính màu xanh (như Shopee)
  neutral: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.neutral,
    },
    text: { color: colors.text },
    spinner: colors.textSecondary,
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
  icon, // phần tử đứng trước chữ (vd. <GoogleLogo />)
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
      ) : icon ? (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.text, v.text]}>{title}</Text>
        </View>
      ) : (
        <Text style={[styles.text, styles.fill, v.text]}>{title}</Text>
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
  text: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, textAlign: "center" },
  // Chữ trải hết bề ngang nút (căn giữa bằng textAlign). Nếu để chữ co vừa khít nội dung, một số máy Android
  // (Oppo/Xiaomi… đổi font hệ thống) đo chữ hụt vài px → rớt chữ cuối xuống dòng 2 bị khuất ("Xem món tương | tự")
  fill: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
