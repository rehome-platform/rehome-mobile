import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { MOCK } from "@/config/env";
import { TX_FILTERS, WALLET_LIMITS } from "@/constants/wallet";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { walletApi } from "../api/walletApi";
import { useTransactions, useWallet } from "../hooks/useWallet";
import { TransactionRow } from "../components/TransactionRow";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");
const WHEN_IN = [
  "Món ký gửi của bạn bán được và đơn hoàn thành.",
  "Đơn bạn mua bị huỷ hoặc trả hàng hợp lệ, tiền hoàn về đây.",
  "Nền tảng đền bù khi hàng của bạn bị hỏng trong lúc ReHome giữ hàng hoặc vận chuyển.",
];

// Số dư lớn + Khả dụng / Đang khoá + Rút tiền / Doanh thu
function Balance({ w }) {
  const canWithdraw = w.availableBalance >= WALLET_LIMITS.MIN_PAYOUT;
  return (
    <View style={styles.balance}>
      <Text style={styles.label}>Số dư</Text>
      <Text style={[styles.big, !w.balance && styles.faded]}>
        {formatVnd(w.balance)}
      </Text>
      {w.balance > 0 ? (
        <>
          <View style={styles.split}>
            <View style={styles.cell}>
              <Text style={styles.label}>Khả dụng</Text>
              <Text style={styles.cellValue}>
                {formatVnd(w.availableBalance)}
              </Text>
            </View>
            <View style={[styles.cell, styles.cellLocked]}>
              <Text style={styles.label}>Đang khoá</Text>
              <Text style={styles.cellValue}>{formatVnd(w.lockedBalance)}</Text>
            </View>
          </View>
          {w.lockedBalance > 0 ? (
            <Text style={styles.hint}>
              Phần đang khoá là tiền của yêu cầu rút đang xử lý, chưa dùng được.
            </Text>
          ) : null}
        </>
      ) : null}
      <View style={styles.actions}>
        <Button
          title="Rút tiền"
          disabled={!canWithdraw}
          onPress={() => router.push("/wallet/withdraw")}
          style={styles.flex}
        />
        {w.balance > 0 ? (
          <Button
            title="Doanh thu"
            variant="secondary"
            onPress={() => router.push("/wallet/revenue")}
            style={styles.flex}
          />
        ) : null}
      </View>
      {w.balance > 0 ? (
        <Button
          title="Xem các yêu cầu rút tiền"
          variant="text"
          onPress={() => router.push("/wallet/payouts")}
        />
      ) : null}

      {!canWithdraw && w.balance > 0 ? (
        <Text style={styles.hint}>
          Rút tối thiểu {formatVnd(WALLET_LIMITS.MIN_PAYOUT)}.
        </Text>
      ) : null}
    </View>
  );
}

// [DEV] xem ví rỗng / có giao dịch
function WalletMockPanel() {
  const queryClient = useQueryClient();
  if (!__DEV__ || !MOCK.wallet) return null;
  const toggle = () => {
    walletApi.mockSetEmpty(!walletApi.mockIsEmpty());
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };
  return (
    <Button
      title={
        walletApi.mockIsEmpty()
          ? "Mock: xem ví có giao dịch"
          : "Mock: xem ví rỗng (người mới)"
      }
      variant="text"
      onPress={toggle}
    />
  );
}

// VI-01 · Ví của tôi (rỗng / có giao dịch)
export default function WalletScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [direction, setDirection] = useState("ALL");
  const wallet = useWallet();
  const txs = useTransactions(direction);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Ví của tôi" onBack={goBack} />;
  if (wallet.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (wallet.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={wallet.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => wallet.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const w = wallet.data;
  const list = txs.data ?? [];
  const brandNew =
    !w.balance && direction === "ALL" && !txs.isPending && !list.length;

  const refresh = () => {
    wallet.refetch();
    txs.refetch();
  };

  // Ví mới: chưa có giao dịch nào → giải thích tiền vào ví khi nào
  if (brandNew) {
    return (
      <Screen scroll header={header} contentStyle={styles.content}>
        <Balance w={w} />
        <View style={styles.emptyHead}>
          <Text style={styles.emptyTitle}>Ví chưa có giao dịch nào</Text>
          <Text style={styles.muted}>
            Tiền sẽ tự vào đây, bạn không phải liên kết tài khoản ngân hàng.
          </Text>
        </View>
        <View style={styles.whenBox}>
          <Text style={styles.whenTitle}>TIỀN VÀO VÍ KHI NÀO</Text>
          {WHEN_IN.map((t, i) => (
            <View key={t} style={styles.whenRow}>
              <Text style={styles.num}>{i + 1}</Text>
              <Text style={styles.text}>{t}</Text>
            </View>
          ))}
        </View>
        <Button
          title="Ký gửi món đầu tiên"
          onPress={() => router.push("/consign")}
        />
        <WalletMockPanel />
      </Screen>
    );
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <Balance w={w} />
      <ChipGroup
        horizontal
        options={TX_FILTERS}
        value={direction}
        onChange={setDirection}
      />
    </View>
  );

  return (
    <Screen header={header} padded={false}>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            onPress={() => router.push(`/wallet/transactions/${item.id}`)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          txs.isPending ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : txs.isError ? (
            <ErrorBox message={txs.error.message}>
              <Button
                title="Thử lại"
                variant="secondary"
                onPress={() => txs.refetch()}
              />
            </ErrorBox>
          ) : (
            <Text style={styles.emptyFilter}>
              Không có giao dịch nào ở mục này.
            </Text>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {txs.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            <NoteBox>
              Ví ReHome không liên kết ngân hàng. Rút tiền là giao dịch mô
              phỏng.
            </NoteBox>
            <WalletMockPanel />
          </View>
        }
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (txs.hasNextPage && !txs.isFetchingNextPage) txs.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={
              (wallet.isRefetching || txs.isRefetching) &&
              !txs.isFetchingNextPage
            }
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  list: { padding: spacing.lg },
  listHeader: { gap: spacing.lg, marginBottom: spacing.sm },
  flex: { flex: 1 },
  balance: { gap: spacing.sm },
  label: { ...textStyles.caption, color: colors.textSecondary },
  big: {
    ...textStyles.title,
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  faded: { color: colors.textSecondary },
  split: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  cell: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cellLocked: {
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderLeftColor: colors.neutral,
  },
  cellValue: { ...textStyles.heading, color: colors.text },
  hint: { ...textStyles.caption, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  emptyHead: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.lg },
  emptyTitle: { ...textStyles.heading, color: colors.text },
  muted: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  text: { flex: 1, ...textStyles.body, color: colors.text },
  whenBox: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  whenTitle: {
    ...textStyles.label,
    color: colors.textSecondary,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  whenRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  num: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.text,
    textAlign: "center",
    ...textStyles.caption,
    lineHeight: 20,
    color: colors.text,
  },
  emptyFilter: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  footer: { gap: spacing.md, marginTop: spacing.lg },
});
