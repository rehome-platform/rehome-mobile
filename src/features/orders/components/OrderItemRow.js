import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { metaLine } from "@/features/products/components/ProductCard";

// Một món trong đơn: ảnh · tên · "Thương hiệu · Size · Tình trạng" · giá lúc đặt. Có productId → bấm mở sản phẩm
export function OrderItemRow({ item }) {
  const onPress = item.productId
    ? () => router.push(`/products/${item.productId}`)
    : undefined;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={22}
            color={colors.textSecondary}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaLine(item.brandName, item.size, item.condition)}
        </Text>
      </View>
      <Text style={styles.price}>{formatVnd(item.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pressed: { opacity: 0.7 },
  thumb: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  info: { flex: 1, gap: 2 },
  name: { ...textStyles.body, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
  price: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
});
