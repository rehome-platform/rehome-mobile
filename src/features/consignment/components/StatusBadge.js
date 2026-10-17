import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { FORM_STATUS, FORM_STATUS_LABEL } from "@/constants/consignment";

// Màu theo trạng thái form. Nền vàng (secondary) luôn dùng chữ tối (design-tokens)
const TONE = {
  [FORM_STATUS.PENDING]: { bg: colors.secondary, fg: colors.text },
  [FORM_STATUS.APPROVED]: { bg: colors.primary, fg: colors.onPrimary },
  [FORM_STATUS.REJECTED]: { bg: colors.error, fg: colors.onPrimary },
  [FORM_STATUS.EXPIRED]: { bg: colors.neutral, fg: colors.textSecondary },
  [FORM_STATUS.CANCELLED]: { bg: colors.neutral, fg: colors.textSecondary },
};

export function StatusBadge({ status }) {
  const tone = TONE[status] ?? TONE[FORM_STATUS.EXPIRED];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>
        {FORM_STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: { ...textStyles.label, fontFamily: fonts.semibold },
});
