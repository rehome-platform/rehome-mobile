import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { PriceTag } from "./PriceTag";

// "Uniqlo · M · Như mới" — bỏ phần BE không trả
export const metaLine = (...parts) => parts.filter(Boolean).join(" · ");

// Thẻ sản phẩm trên sàn (BR-01, BR-02). Ảnh 3:4, nền xám trong lúc ảnh đang tải
export function ProductCard({ product, onPress, style }) {
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
        <Text style={styles.badge}>ĐÃ KIỂM ĐỊNH</Text>
      </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  pressed: { opacity: 0.8 },
  photo: {
    aspectRatio: 3 / 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
    marginBottom: spacing.xs,
  },
  badge: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    ...textStyles.label,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  name: { ...textStyles.body, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
});
