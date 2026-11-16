import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { discountPercent, formatVnd } from "@/utils/money";

// Giá đang bán (đậm). Đã giảm so với giá chốt ký gửi → thêm giá cũ gạch ngang.
// struck: món đã bán → gạch luôn giá hiện tại (BR-04). large: cỡ chữ ở màn chi tiết
// showOff: thêm nhãn "-x%" cạnh giá cũ (màn chi tiết; thẻ ngoài sàn đã có nhãn trên ảnh)
export function PriceTag({
  currentPrice,
  originalPrice,
  large = false,
  struck = false,
  showOff = false,
}) {
  const reduced =
    !struck && originalPrice != null && currentPrice < originalPrice;
  const off =
    showOff && reduced ? discountPercent(currentPrice, originalPrice) : 0;
  return (
    <View style={styles.row}>
      <Text
        style={[styles.price, large && styles.large, struck && styles.struck]}
      >
        {formatVnd(currentPrice)}
      </Text>
      {reduced ? (
        <Text style={styles.old}>{formatVnd(originalPrice)}</Text>
      ) : null}
      {off > 0 ? <Text style={styles.off}>-{off}%</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: spacing.sm,
  },
  price: {
    ...textStyles.heading,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  large: { fontSize: 24, lineHeight: 32 },
  struck: { textDecorationLine: "line-through", color: colors.textSecondary },
  old: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  off: {
    ...textStyles.label,
    fontFamily: fonts.bold,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.input,
    overflow: "hidden",
    backgroundColor: tones.warning.bg,
    color: tones.warning.fg,
  },
});
