import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Checkbox } from "@/components/ui/Checkbox";
import { unavailableLabel } from "@/constants/order";
import { PriceTag } from "@/features/products/components/PriceTag";
import { metaLine } from "@/features/products/components/ProductCard";

// Một món trong giỏ: ô tích · ảnh · tên, size, giá · nút ✕. Món không khả dụng: mờ, giá gạch, nhãn lý do, khoá ô tích
export function CartItemRow({ item, checked, onToggle, onRemove, removing }) {
  const p = item.product;
  const unavailable = !!item.unavailableReason;
  return (
    <View style={[styles.row, unavailable && styles.rowUnavailable]}>
      <Checkbox
        checked={checked}
        onChange={onToggle}
        disabled={unavailable}
        accessibilityLabel={`Chọn ${p.name}`}
        style={styles.check}
      />
      <Pressable
        onPress={() => router.push(`/products/${p.id}`)}
        accessibilityRole="button"
        accessibilityLabel={p.name}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={[styles.thumb, unavailable && styles.faded]}>
          {p.thumbnailUrl ? (
            <Image
              source={{ uri: p.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Ionicons
              name="shirt-outline"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.name, unavailable && styles.muted]}
            numberOfLines={2}
          >
            {p.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {/* BE chưa trả brandName / condition trong giỏ (câu hỏi 21b) — có thì tự hiện */}
            {metaLine(
              p.brandName,
              p.size ? `Size ${p.size}` : null,
              p.condition,
            )}
          </Text>
          <PriceTag
            currentPrice={p.currentPrice}
            originalPrice={p.originalPrice}
            struck={unavailable}
          />
          {unavailable ? (
            <Text style={styles.reason}>
              {unavailableLabel(item.unavailableReason)}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        disabled={removing}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Xoá ${p.name} khỏi giỏ`}
        style={({ pressed }) => [
          styles.remove,
          (pressed || removing) && styles.pressed,
        ]}
      >
        <Ionicons name="close" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  rowUnavailable: { backgroundColor: colors.background },
  check: { marginTop: spacing.xs },
  main: { flex: 1, flexDirection: "row", gap: spacing.md },
  pressed: { opacity: 0.6 },
  thumb: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  faded: { opacity: 0.5 },
  info: { flex: 1, gap: 2 },
  name: { ...textStyles.body, color: colors.text },
  muted: { color: colors.textSecondary },
  meta: { ...textStyles.caption, color: colors.textSecondary },
  reason: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 4,
    ...textStyles.label,
    color: colors.text,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
});
