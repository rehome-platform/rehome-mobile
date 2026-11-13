import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { BILLING_CYCLE } from "@/constants/membership";
import { formatVnd } from "@/utils/money";
import { benefitLines, priceOf } from "../utils/membershipRules";
import { TierBadge } from "./TierBadge";

// Thẻ một gói ở M-01. Xếp DỌC cả 3 gói (wireframe kéo ngang làm gói Kim cương khuất ngoài màn).
// action: { kind, label } từ planAction(); current: là gói đang dùng
export function PlanCard({ plan, cycle, current, action, onPress }) {
  const price = priceOf(plan, cycle);
  const yearly = cycle === BILLING_CYCLE.YEARLY;
  const noYearly = yearly && price == null;

  return (
    <View style={[styles.card, current && styles.current]}>
      <View style={styles.head}>
        <TierBadge tier={plan.tier} />
        {current ? <StatusChip label="Gói của bạn" tone="success" /> : null}
      </View>
      <Text style={styles.name}>{plan.name}</Text>
      {plan.description ? (
        <Text style={styles.desc}>{plan.description}</Text>
      ) : null}

      {noYearly ? (
        <Text style={styles.desc}>Gói này không bán theo năm</Text>
      ) : (
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatVnd(price)}</Text>
          <Text style={styles.per}>{yearly ? "/ năm" : "/ tháng"}</Text>
        </View>
      )}
      {yearly && price ? (
        <Text style={styles.desc}>≈ {formatVnd(price / 12)} mỗi tháng</Text>
      ) : null}

      <View style={styles.benefits}>
        {benefitLines(plan).map((line) => (
          <View key={line} style={styles.benefit}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.benefitText}>{line}</Text>
          </View>
        ))}
      </View>

      <Button
        title={action.label}
        variant={current || action.kind === "UPGRADE" || action.kind === "BUY" ? "primary" : "secondary"}
        disabled={noYearly}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  current: { borderWidth: 2, borderColor: colors.primary },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.caption, color: colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
  price: {
    ...textStyles.title,
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  per: { ...textStyles.body, color: colors.textSecondary },
  benefits: { gap: spacing.xs, paddingVertical: spacing.xs },
  benefit: { flexDirection: "row", gap: spacing.sm },
  benefitText: { flex: 1, ...textStyles.body, color: colors.text },
});
