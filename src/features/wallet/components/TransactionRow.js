import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { TX_STATUS, TX_STATUS_LABEL, txLabel } from "@/constants/wallet";
import { toDate } from "@/features/orders/utils/time";
import { formatSigned, isIncoming } from "../utils/txDirection";

// Một dòng lịch sử ví: loại · (đơn / ghi chú) · thời điểm | số tiền có dấu · trạng thái
export function TransactionRow({ tx, onPress }) {
  const sub = [
    tx.relatedOrderNo ? `Đơn ${tx.relatedOrderNo}` : tx.note,
    toDate(tx.createdAt).format("DD/MM/YYYY HH:mm"),
  ]
    .filter(Boolean)
    .join(" · ");
  const pending = tx.status !== TX_STATUS.SUCCESS;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.title}>{txLabel(tx.type)}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isIncoming(tx) && styles.amountIn]}>
          {formatSigned(tx.amount)}
        </Text>
        <Text style={[styles.status, pending && styles.statusPending]}>
          {TX_STATUS_LABEL[tx.status] ?? tx.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  pressed: { opacity: 0.7 },
  left: { flex: 1, gap: 2 },
  right: { alignItems: "flex-end", gap: 2 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  amount: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  amountIn: { color: colors.success },
  status: { ...textStyles.caption, color: colors.textSecondary },
  statusPending: { fontFamily: fonts.semibold, color: colors.text },
});
