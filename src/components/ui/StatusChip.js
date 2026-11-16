import { StyleSheet, Text, View } from "react-native";
import { fonts, radius, spacing, textStyles, tones } from "@/theme";

// Nhãn trạng thái dùng chung (đơn, trả hàng, ký gửi, ví…): chip bo tròn, nền nhạt + chữ cùng tông.
// tone: "success" | "info" | "warning" | "danger" | "neutral" (xem tones trong theme/colors.js)
export function StatusChip({ label, tone = "neutral", style }) {
  const t = tones[tone] ?? tones.neutral;
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: { ...textStyles.label, fontFamily: fonts.semibold },
});
