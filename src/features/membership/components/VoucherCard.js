import { StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  MEMBERSHIP_LIMITS,
  VOUCHER_STATUS,
  VOUCHER_TYPE_LABEL,
} from "@/constants/membership";
import { voucherCondition, voucherHeadline } from "../utils/membershipRules";
import { VoucherCode, VoucherTicket } from "./VoucherTicket";

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "");

// Một mã trong "Voucher của tôi" (M-04), dạng vé. Tên, mô tả, điều kiện lấy từ BE (Admin đặt) — không viết cứng "free ship".
// Đã dùng / hết hạn: cuống xám + dấu "Đã dùng" / "Hết hạn" ở góc
export function VoucherCard({ voucher: v }) {
  const unused = v.status === VOUCHER_STATUS.UNUSED;
  const used = v.status === VOUCHER_STATUS.USED;
  const soon =
    unused && v.daysRemaining <= MEMBERSHIP_LIMITS.EXPIRING_SOON_DAYS;

  return (
    <VoucherTicket
      headline={voucherHeadline(v)}
      kind={VOUCHER_TYPE_LABEL[v.type]}
      muted={!unused}
      stamp={unused ? null : used ? "Đã dùng" : "Hết hạn"}
    >
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, !unused && styles.titleMuted]}
          numberOfLines={2}
        >
          {v.name}
        </Text>
        {soon ? (
          <StatusChip
            label={
              v.daysRemaining <= 0
                ? "Hết hạn hôm nay"
                : `Còn ${v.daysRemaining} ngày`
            }
            tone="warning"
          />
        ) : null}
      </View>
      <Text style={styles.line}>{voucherCondition(v)}</Text>
      <VoucherCode code={v.code} muted={!unused} />
      <Text style={styles.line}>
        {unused
          ? `HSD ${fmt(v.expiresAt)}`
          : used
            ? `Đã dùng ${fmt(v.usedAt)}${v.usedOrderNos?.length ? ` · Đơn ${v.usedOrderNos.join(", ")}` : ""}`
            : `Hết hạn ${fmt(v.expiresAt)} · Không dùng kịp`}
      </Text>
    </VoucherTicket>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  title: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  // chừa chỗ cho dấu "Đã dùng / Hết hạn" ở góc phải
  titleMuted: { color: colors.textSecondary, paddingRight: 72 },
  line: { ...textStyles.caption, color: colors.textSecondary },
});
