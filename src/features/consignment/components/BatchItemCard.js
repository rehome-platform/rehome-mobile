import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { conditionLabel } from "@/constants/consignItem";
import { orderedPhotos } from "@/features/consignment/utils/consignItem";
import { Checkbox } from "@/components/ui/Checkbox";

// Một món trong "lần gửi": ảnh đại diện, tên, danh mục · thương hiệu, size · tình trạng, giá.
// onEdit / onRemove không truyền → ẩn nút (bước Xem lại). result = { ok, message } sau khi gửi lỗi.
// onToggle có → ô tích bên trái (bước Xem lại: chọn món nào gửi lần này), bấm cả thẻ cũng đổi tích
export function BatchItemCard({
  item,
  onEdit,
  onRemove,
  result,
  selected,
  onToggle,
}) {
  const thumb = orderedPhotos(item)[0];
  const meta = [
    item.size && item.size !== "Khác" ? `Size ${item.size}` : null,
    conditionLabel(item.condition),
  ]
    .filter(Boolean)
    .join(" · ");
  const failed = result && !result.ok;

  return (
    <Pressable
      onPress={onToggle}
      disabled={!onToggle}
      accessibilityRole={onToggle ? "checkbox" : undefined}
      accessibilityState={onToggle ? { checked: !!selected } : undefined}
      style={[
        styles.card,
        failed && styles.cardFailed,
        onToggle && !selected && styles.cardOff,
      ]}
    >
      <View style={styles.row}>
        {onToggle ? (
          <View style={styles.check}>
            <Checkbox
              checked={!!selected}
              onChange={onToggle}
              accessibilityLabel={`Gửi món ${item.productName}`}
            />
          </View>
        ) : null}
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]} />
        )}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {item.productName}
          </Text>
          {item.draftId && !result ? (
            <View style={styles.draftTag}>
              <Ionicons
                name="cloud-done-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.draftText}>Đã lưu nháp</Text>
            </View>
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            {item.categoryName} · {item.brandName}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          <Text style={styles.price}>{formatVnd(item.desiredPrice)}</Text>
        </View>
        {onEdit || onRemove ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sửa món"
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Xoá món"
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      {failed ? (
        <Text style={styles.error}>Chưa gửi được: {result.message}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  draftTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.neutral,
  },
  draftText: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardFailed: { borderColor: colors.error },
  cardOff: { opacity: 0.55 }, // bỏ tích → mờ: món này giữ nháp, không gửi lần này
  check: { justifyContent: "center" },
  row: { flexDirection: "row", gap: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.input },
  thumbEmpty: { backgroundColor: colors.neutral },
  body: { flex: 1, gap: 2 },
  name: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
  price: { ...textStyles.body, fontFamily: fonts.bold, color: colors.primary },
  actions: { justifyContent: "space-between", alignItems: "center" },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
