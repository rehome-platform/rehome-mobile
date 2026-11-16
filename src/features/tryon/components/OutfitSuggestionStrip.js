import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";

// Dải "AI gợi ý phối cùng" dưới các ô (AI phối đồ): các món hợp khác ngoài món đang chọn, bấm một cái là đổi.
// items: danh sách món BE gợi ý (đã xếp hợp nhất trước); selectedId: món đang nằm trong ô; onPick(product)
export function OutfitSuggestionStrip({ title, items, selectedId, onPick, onMore }) {
  if (!items?.length) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((p) => {
          const on = p.id === selectedId;
          return (
            <Pressable
              key={p.id}
              onPress={() => onPick(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={p.name}
              style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && styles.pressed]}
            >
              <View style={styles.photo}>
                {p.thumbnailUrl ? (
                  <Image source={{ uri: p.thumbnailUrl }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Ionicons name="shirt-outline" size={24} color={colors.textSecondary} />
                )}
                {on ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={styles.price}>{formatVnd(p.currentPrice)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {onMore ? (
        <Text style={styles.more} onPress={onMore} accessibilityRole="button">
          Không ưng? Tự chọn món khác ›
        </Text>
      ) : null}
    </View>
  );
}

const CARD_W = 104;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  row: { gap: spacing.sm },
  card: {
    width: CARD_W,
    gap: 2,
    padding: spacing.xs,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  cardOn: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  photo: {
    height: CARD_W,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input - 4,
    backgroundColor: colors.neutral,
  },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  name: { ...textStyles.caption, color: colors.text },
  price: { ...textStyles.caption, fontFamily: fonts.semibold, color: colors.primary },
  more: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.accent },
});
