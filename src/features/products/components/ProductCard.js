import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { discountPercent } from "@/utils/money";
import { PriceTag } from "./PriceTag";

// "Uniqlo · M · Như mới" — bỏ phần BE không trả
export const metaLine = (...parts) => parts.filter(Boolean).join(" · ");

// Thẻ sản phẩm trên sàn (BR-01, BR-02) kiểu Shopee: thẻ trắng bo góc, ảnh 3:4 (quần áo chụp dọc),
// nhãn nhỏ "Đã kiểm định" góc trên trái, nhãn "-x%" góc trên phải khi đã giảm giá
export function ProductCard({ product, onPress, style }) {
  const off = discountPercent(product.currentPrice, product.originalPrice);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {product.thumbnailUrl ? (
          <Image
            source={{ uri: product.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={32}
            color={colors.textSecondary}
          />
        )}
        <View style={styles.verified}>
          <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
          <Text style={styles.verifiedText}>Đã kiểm định</Text>
        </View>
        {off > 0 ? <Text style={styles.off}>-{off}%</Text> : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <PriceTag
          currentPrice={product.currentPrice}
          originalPrice={product.originalPrice}
        />
        <Text style={styles.meta} numberOfLines={1}>
          {metaLine(product.brandName, product.size, product.condition)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  photo: {
    aspectRatio: 3 / 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral,
  },
  verified: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  verifiedText: {
    ...textStyles.label,
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  off: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomLeftRadius: radius.input,
    overflow: "hidden",
    backgroundColor: colors.secondary,
    color: colors.text,
    ...textStyles.label,
    fontFamily: fonts.bold,
  },
  body: { gap: 2, padding: spacing.sm },
  name: { ...textStyles.body, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
});
