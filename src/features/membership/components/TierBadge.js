import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { TIER, TIER_SHORT } from "@/constants/membership";

// Nhãn hạng: Thường (xám) · Bạc · Vàng · Kim cương. inverse: đặt trên nền xanh đậm (thẻ gói của tôi)
const ICON = {
  [TIER.FREE]: "person-outline",
  [TIER.SILVER]: "medal-outline",
  [TIER.GOLD]: "medal",
  [TIER.DIAMOND]: "diamond",
};

export function TierBadge({ tier, inverse = false, style }) {
  const tone = tier === TIER.FREE ? tones.neutral : tones.warning;
  const fg = inverse ? colors.onPrimary : tone.fg;
  return (
    <View
      style={[
        styles.badge,
        inverse ? styles.inverse : { backgroundColor: tone.bg },
        style,
      ]}
    >
      <Ionicons name={ICON[tier] ?? "medal-outline"} size={12} color={fg} />
      <Text style={[styles.text, { color: fg }]}>
        {(TIER_SHORT[tier] ?? tier).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  inverse: { borderWidth: 1, borderColor: colors.onPrimary },
  text: { ...textStyles.label, fontFamily: fonts.semibold },
});
