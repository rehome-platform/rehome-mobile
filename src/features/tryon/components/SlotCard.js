import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { TRYON_SLOT_LABEL } from "@/constants/tryon";

// Một ô của bộ đồ (AI-01): trống → "Chọn …"; món đang xem → khoá; món đã chọn → ✕ + "Đổi món khác"
export function SlotCard({ slot, item, locked, onPick, onRemove }) {
  const label = TRYON_SLOT_LABEL[slot];
  if (!item) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.slot}>SLOT {label.toUpperCase()}</Text>
        <View style={styles.emptyBody}>
          <Ionicons name="add" size={28} color={colors.textSecondary} />
          <Text style={styles.muted}>Chưa chọn</Text>
        </View>
        <Button
          title={`Chọn ${label.toLowerCase()}`}
          variant="secondary"
          onPress={onPick}
          style={styles.btn}
        />
      </View>
    );
  }
  return (
    <View style={[styles.card, locked && styles.locked]}>
      <View style={styles.head}>
        <Text style={styles.slot}>SLOT {label.toUpperCase()}</Text>
        {!locked ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Bỏ ${label.toLowerCase()}`}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.photo}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={28}
            color={colors.textSecondary}
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.muted}>{formatVnd(item.currentPrice)}</Text>
      {locked ? (
        <Text style={styles.tag}>MÓN BẠN ĐANG XEM</Text>
      ) : (
        <Button
          title="Đổi món khác"
          variant="secondary"
          onPress={onPick}
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  locked: { borderWidth: 2, borderColor: colors.primary },
  empty: { borderStyle: "dashed", borderColor: colors.textSecondary },
  emptyBody: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slot: { ...textStyles.label, color: colors.textSecondary },
  photo: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  name: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  btn: { minHeight: 36, paddingHorizontal: spacing.sm },
});
