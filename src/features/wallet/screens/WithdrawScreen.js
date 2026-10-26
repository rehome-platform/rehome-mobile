import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { MoneyField } from "@/components/ui/MoneyField";
import { NoteBox } from "@/components/ui/NoteBox";
import { MOCK } from "@/config/env";
import { TX_STATUS } from "@/constants/wallet";
import { useAuthStore } from "@/stores/authStore";
import { formatNumber, formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { walletApi } from "../api/walletApi";
import {
  useCreatePayout,
  usePayouts,
  useWallet,
  useWalletConfig,
} from "../hooks/useWallet";
import { validatePayoutAmount } from "../utils/payoutRules";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/wallet");
const QUICK = [100000, 500000];

function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.strong : styles.muted}>{label}</Text>
      <Text style={strong ? styles.strongBig : styles.text}>{value}</Text>
    </View>
  );
}

// VI-04 · Rút tiền (bình thường / vượt khả dụng). Mở với ?amount= để điền sẵn (nút "Tạo lại yêu cầu rút")
export default function WithdrawScreen() {
  const params = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const wallet = useWallet();
  const config = useWalletConfig();
  const payouts = usePayouts();
  const create = useCreatePayout();
  const [amount, setAmount] = useState(() =>
    params.amount ? Number(params.amount) : undefined,
  );
  const [touched, setTouched] = useState(!!params.amount);
  const [serverError, setServerError] = useState(null);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Rút tiền" onBack={goBack} />;
  if (wallet.isPending || config.isPending) {
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
  const c = config.data;
  const available = w.availableBalance;
  const error = validatePayoutAmount(amount, {
    available,
    minPayout: c.minPayout,
    usedToday: c.usedToday,
    maxPerDay: c.maxPayoutsPerDay,
  });
  const overAvailable = amount != null && amount > available;
  // Yêu cầu đang giữ phần tiền khoá (để giải thích "vì sao không rút được cả")
  const locking = (payouts.data ?? []).find(
    (p) => p.status === TX_STATUS.PENDING || p.status === TX_STATUS.PROCESSING,
  );

  const change = (v) => {
    setAmount(v);
    setTouched(true);
    setServerError(null);
  };

  const submit = () =>
    Alert.alert(
      `Rút ${formatVnd(amount)}?`,
      "Số tiền này bị khoá ngay trong ví cho tới khi giao dịch xong.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Rút tiền",
          onPress: () =>
            create.mutate(amount, {
              onSuccess: (p) => router.replace(`/wallet/payouts/${p.id}`),
              onError: (e) => {
                setServerError(e.message); // 409 có code — hiện message BE dưới ô, số dư có thể vừa đổi
                wallet.refetch();
                config.refetch();
              },
            }),
        },
      ],
    );

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        <Button
          title={amount && !error ? `Rút ${formatVnd(amount)}` : "Rút tiền"}
          disabled={!!error}
          loading={create.isPending}
          onPress={submit}
        />
      }
    >
      <MoneyField
        label="Số tiền muốn rút"
        helper={`Khả dụng ${formatVnd(available)}`}
        value={amount}
        onChange={change}
        error={serverError ?? (touched ? error : null)}
      />

      <View style={styles.chips}>
        {QUICK.map((v) => (
          <Pressable
            key={v}
            onPress={() => change(v)}
            disabled={v > available}
            style={({ pressed }) => [
              styles.chip,
              v > available && styles.chipOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.chipText}>{formatNumber(v)}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => change(available)}
          disabled={available <= 0}
          style={({ pressed }) => [
            styles.chip,
            available <= 0 && styles.chipOff,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.chipText}>Tất cả</Text>
        </Pressable>
      </View>

      {overAvailable ? (
        <View style={styles.boxStrong}>
          <Text style={styles.boxTitle}>
            Vì sao không rút được cả {formatVnd(w.balance)}?
          </Text>
          <Row label="Số dư ví" value={formatVnd(w.balance)} />
          <Row
            label={
              locking
                ? `Đang khoá cho yêu cầu ${locking.code ?? ""}`
                : "Đang khoá"
            }
            value={`− ${formatVnd(w.lockedBalance)}`}
          />
          <View style={styles.divider} />
          <Row strong label="Rút được tối đa" value={formatVnd(available)} />
          {locking ? (
            <Text style={styles.muted}>
              Yêu cầu {locking.code ?? ""} đang xử lý. Khi nó xong hoặc thất
              bại, phần khoá sẽ được giải phóng.
            </Text>
          ) : null}
          <View style={styles.boxActions}>
            <Button
              title={`Rút ${formatVnd(available)}`}
              variant="secondary"
              onPress={() => change(available)}
              style={styles.flex}
            />
            {locking ? (
              <Button
                title={`Xem ${locking.code ?? "yêu cầu"}`}
                variant="secondary"
                onPress={() => router.push(`/wallet/payouts/${locking.id}`)}
                style={styles.flex}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>ĐIỀU KIỆN RÚT</Text>
            <Row label="Số tiền tối thiểu" value={formatVnd(c.minPayout)} />
            {c.usedToday != null ? (
              <Row
                label="Lượt rút hôm nay"
                value={`đã dùng ${c.usedToday} / ${c.maxPayoutsPerDay}`}
              />
            ) : null}
            <Row label="Người duyệt" value="không cần — xử lý ngay" />
          </View>
          {amount && !error ? (
            <View style={styles.boxStrong}>
              <Text style={styles.boxTitle}>Sau khi bấm rút</Text>
              <Text style={styles.text}>
                {formatVnd(amount)} bị khoá ngay trong ví, số dư khả dụng còn{" "}
                {formatVnd(available - amount)}. Nếu giao dịch thất bại, tiền
                được nhả lại đầy đủ.
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* [CHỜ LEAD] câu chữ "mô phỏng" (PHASE4_GUIDE câu 23) */}
      <NoteBox>
        Ví ReHome không liên kết ngân hàng, không cần số tài khoản. Rút tiền
        trong ứng dụng là giao dịch mô phỏng.
      </NoteBox>

      {__DEV__ && MOCK.wallet ? (
        <Button
          title="Mock: lần rút sau thất bại"
          variant="text"
          onPress={() => {
            walletApi.mockNextPayoutFails();
            showToast("Đã bật: lần rút tới sẽ thất bại");
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  strongBig: {
    ...textStyles.heading,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  chips: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  chipOff: { opacity: 0.4 },
  chipText: { ...textStyles.body, color: colors.text },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.md,
  },
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  boxLabel: { ...textStyles.label, color: colors.textSecondary },
  boxTitle: { ...textStyles.heading, color: colors.text },
  divider: { height: 1, backgroundColor: colors.neutral },
  boxActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
});
