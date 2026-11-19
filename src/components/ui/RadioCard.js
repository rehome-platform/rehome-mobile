import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Thẻ chọn một trong nhiều (AU-03: Cá nhân / Tổ chức; OA-01: loại hình tổ chức; phương thức thanh toán)
// logo: phần tử đứng bên phải tiêu đề (vd. <VnpayLogo /> ở thẻ chọn cổng thanh toán)
export function RadioCard({
  title,
  description,
  selected = false,
  onPress,
  logo,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {logo ? (
        <View style={styles.head}>
          <Text style={[styles.title, styles.flex]}>{title}</Text>
          {logo}
        </View>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2, // luôn dày 2 → chọn/bỏ chọn không làm thẻ "nhảy" kích thước
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  desc: { ...textStyles.caption, color: colors.textSecondary },
});
