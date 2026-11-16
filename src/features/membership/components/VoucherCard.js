import { StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  MEMBERSHIP_LIMITS,
  VOUCHER_STATUS,
  VOUCHER_TYPE_LABEL,
} from "@/constants/membership";
import { voucherCondition, voucherHeadline } from "../utils/membershipRules";

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "");

// Một mã trong "Voucher của tôi" (M-04). Tên, mô tả, điều kiện lấy từ BE (Admin đặt) — không viết cứng "free ship"
export function VoucherCard({ voucher: v }) {
  const unused = v.status === VOUCHER_STATUS.UNUSED;
  const used = v.status === VOUCHER_STATUS.USED;
  const soon =
    unused && v.daysRemaining <= MEMBERSHIP_LIMITS.EXPIRING_SOON_DAYS;

  return (
    <View style={[styles.card, !unused && styles.faded]}>
      <View style={[styles.stub, !unused && styles.stubFaded]}>
        <Text style={[styles.headline, !unused && styles.mutedText]}>
          {voucherHeadline(v)}
        </Text>
        <Text style={[styles.kind, !unused && styles.mutedText]}>
          {VOUCHER_TYPE_LABEL[v.type] ?? ""}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              !unused && styles.mutedText,
              v.status === VOUCHER_STATUS.EXPIRED && styles.strike,
            ]}
            numberOfLines={2}
          >
            {v.name}
          </Text>
          {soon ? (
            <StatusChip
              label={v.daysRemaining <= 0 ? "Hết hạn hôm nay" : `Còn ${v.daysRemaining} ngày`}
              tone="warning"
            />
          ) : null}
        </View>
        <Text style={styles.line}>{voucherCondition(v)}</Text>
        <Text style={styles.line}>Mã {v.code}</Text>
        <Text style={styles.line}>
          {unused
            ? `Hết hạn ${fmt(v.expiresAt)}`
            : used
              ? `Đã dùng ${fmt(v.usedAt)}${v.usedOrderNos?.length ? ` · Đơn ${v.usedOrderNos.join(", ")}` : ""}`
              : `Hết hạn ${fmt(v.expiresAt)} · Không dùng kịp`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  faded: { backgroundColor: colors.background },
  stub: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.neutral,
    borderStyle: "dashed",
    backgroundColor: colors.highlight,
  },
  stubFaded: { backgroundColor: colors.neutral },
  headline: {
    ...textStyles.title,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  kind: { ...textStyles.label, fontFamily: fonts.semibold, color: colors.primary },
  mutedText: { color: colors.textSecondary },
  strike: { textDecorationLine: "line-through" },
  body: { flex: 1, gap: 2, padding: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  title: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  line: { ...textStyles.caption, color: colors.textSecondary },
});
