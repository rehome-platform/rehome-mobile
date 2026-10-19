import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import {
  TX_STATUS,
  TX_STATUS_LABEL,
  WALLET_TX_TYPE as T,
  txLabel,
} from "@/constants/wallet";
import { KeyValueTable } from "@/features/consignment/components/KeyValueTable";
import { toDate } from "@/features/orders/utils/time";
import { useRevenue, useTransaction } from "../hooks/useWallet";
import { formatSigned, isIncoming } from "../utils/txDirection";
import { AmountBreakdown } from "../components/AmountBreakdown";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/wallet");
// Đơn MUA của chính mình → mở được. Đơn BÁN (ORDER_PAYOUT) là đơn của người mua → 403 [CHỜ BE câu 14]
const OPENABLE_ORDER = [T.REFUND, T.ORDER_PAYMENT];

// VI-02 · Chi tiết giao dịch
export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useTransaction(id);
  const revenue = useRevenue(); // cách tính tiền của giao dịch Bán hàng

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Chi tiết giao dịch" onBack={goBack} />;
  if (query.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
        {query.error.status === 404 ? (
          <EmptyState icon="wallet-outline" title="Không tìm thấy giao dịch" />
        ) : (
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        )}
      </Screen>
    );
  }

  const tx = query.data;
  const isSale = tx.type === T.ORDER_PAYOUT;
  const sale = isSale
    ? revenue.data?.find((r) => r.orderId === tx.relatedOrderId)
    : null;
  const canOpenOrder = OPENABLE_ORDER.includes(tx.type) && tx.relatedOrderId;

  // Chỉ hiện dòng có dữ liệu (mã GD, số dư sau GD… BE chưa trả — câu 13)
  const rows = [
    tx.code && { label: "Mã giao dịch", value: tx.code },
    { label: "Loại", value: txLabel(tx.type) },
    {
      label: "Thời điểm",
      value: toDate(tx.createdAt).format("DD/MM/YYYY HH:mm"),
    },
    tx.relatedOrderNo && { label: "Đơn liên quan", value: tx.relatedOrderNo },
    tx.note && !isSale && { label: "Ghi chú", value: tx.note },
    tx.balanceAfter != null && {
      label: "Số dư sau GD",
      value: formatSigned(tx.balanceAfter).replace("+", ""),
    },
  ].filter(Boolean);

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        canOpenOrder ? (
          <Button
            title={`Xem đơn hàng ${tx.relatedOrderNo ?? ""}`}
            variant="secondary"
            onPress={() => router.push(`/orders/${tx.relatedOrderId}`)}
          />
        ) : tx.payoutId ? (
          <Button
            title="Xem yêu cầu rút"
            variant="secondary"
            onPress={() => router.push(`/wallet/payouts/${tx.payoutId}`)}
          />
        ) : null
      }
    >
      <View style={styles.top}>
        <Text style={styles.muted}>
          {isIncoming(tx) ? "Tiền vào ví" : "Tiền ra khỏi ví"} ·{" "}
          {txLabel(tx.type)}
        </Text>
        <Text style={styles.amount}>{formatSigned(tx.amount)}</Text>
        <Text
          style={[
            styles.badge,
            tx.status === TX_STATUS.SUCCESS && styles.badgeDone,
          ]}
        >
          {(TX_STATUS_LABEL[tx.status] ?? tx.status).toUpperCase()}
        </Text>
      </View>

      {isSale ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIỀN ĐƯỢC TÍNH THẾ NÀO</Text>
          {sale ? (
            <AmountBreakdown row={sale} />
          ) : revenue.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.muted}>
              Chưa có chi tiết cách tính cho đơn này.
            </Text>
          )}
          {/* PHASE4_GUIDE 0.4 #9: ghi chung, không tự suy "kỳ 1, ngày thứ 28" */}
          <NoteBox>
            Hoa hồng tính theo kỳ đang chạy lúc đơn được đặt, không theo lúc đơn
            hoàn thành.
          </NoteBox>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THÔNG TIN GIAO DỊCH</Text>
        <KeyValueTable rows={rows} />
      </View>

      {isSale && (sale?.productName || tx.note) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MÓN HÀNG</Text>
          <Text style={styles.strong}>{sale?.productName ?? tx.note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.xl },
  top: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  muted: { ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  amount: {
    ...textStyles.title,
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input / 3,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  badgeDone: { backgroundColor: colors.text, color: colors.surface },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
});
