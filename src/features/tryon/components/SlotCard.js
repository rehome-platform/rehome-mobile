import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { TRYON_SLOT_LABEL } from "@/constants/tryon";

// Một ô của bộ đồ (AI-01): trống → "Chọn …"; món đang xem → khoá; món đã chọn → ✕ + "Đổi món khác".
// aiPick: món do AI gợi ý tự điền (nhãn "AI gợi ý" để người dùng biết không phải họ chọn).
// aiLoading: ô trống trong lúc AI đang tìm món hợp
export function SlotCard({ slot, item, locked, aiPick, aiLoading, onPick, onRemove }) {
  const label = TRYON_SLOT_LABEL[slot];
  if (!item) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.slot}>SLOT {label.toUpperCase()}</Text>
        <View style={styles.emptyBody}>
          {aiLoading ? (
            <>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.muted, styles.center]}>
                AI đang tìm {label.toLowerCase()} hợp…
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="add" size={28} color={colors.textSecondary} />
              <Text style={styles.muted}>Chưa chọn</Text>
            </>
          )}
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
      {aiPick && !locked ? (
        <View style={styles.aiTag}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.aiTagText}>AI gợi ý</Text>
        </View>
      ) : null}
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
  center: { textAlign: "center" },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.highlight,
  },
  aiTagText: { ...textStyles.label, fontFamily: fonts.semibold, color: colors.primary },
});
