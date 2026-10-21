import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import {
  PRODUCT_ENDED_LABEL,
  PRODUCT_VIEW,
  PRODUCT_VIEW_LABEL,
} from "@/constants/consignment";
import { getProductView } from "@/utils/consignment";

const TONE = {
  [PRODUCT_VIEW.AWAITING_DECISION]: { bg: colors.error, fg: colors.onPrimary },
  [PRODUCT_VIEW.REPRICING]: { bg: colors.secondary, fg: colors.text },
  [PRODUCT_VIEW.SELLING]: { bg: colors.primary, fg: colors.onPrimary },
  [PRODUCT_VIEW.HAS_ORDER]: { bg: colors.accent, fg: colors.onPrimary },
  [PRODUCT_VIEW.ENDED]: { bg: colors.neutral, fg: colors.textSecondary },
  [PRODUCT_VIEW.PICKUP]: { bg: colors.accent, fg: colors.onPrimary },
  [PRODUCT_VIEW.WITHDRAWING]: { bg: colors.accent, fg: colors.onPrimary },
};

export function ProductBadge({ product }) {
  const view = getProductView(product);
  const label =
    view === PRODUCT_VIEW.ENDED
      ? PRODUCT_ENDED_LABEL[product.status]
      : PRODUCT_VIEW_LABEL[view];
  const tone = TONE[view];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
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
