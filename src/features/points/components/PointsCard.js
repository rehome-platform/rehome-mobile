import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatNumber } from "@/utils/money";
import { usePoints } from "../hooks/usePoints";

// Tab Cá nhân: thẻ điểm tích lũy, nằm dưới thẻ ví. Lỗi tải → "—", bấm để thử lại (không chặn cả màn)
export function PointsCard() {
  const points = usePoints();
  const p = points.data;
  const onPress = () =>
    points.isError ? points.refetch() : router.push("/points");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Điểm tích lũy của tôi"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name="star" size={22} color={colors.primary} />
      </View>
      <View style={styles.left}>
        <Text style={styles.label}>ĐIỂM TÍCH LŨY</Text>
        <Text style={styles.amount}>
          {p ? `${formatNumber(p.pointsBalance)} điểm` : "—"}
        </Text>
        {points.isError ? (
          <Text style={styles.sub}>Chưa tải được — chạm để thử lại</Text>
        ) : p && p.vndPerPoint <= 0 ? (
          <Text style={styles.sub}>Tích điểm đang tạm tắt</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.highlight,
  },
  left: { flex: 1, gap: 2 },
  label: { ...textStyles.label, color: colors.textSecondary },
  amount: { ...textStyles.heading, fontFamily: fonts.bold, color: colors.primary },
  sub: { ...textStyles.caption, color: colors.textSecondary },
});
