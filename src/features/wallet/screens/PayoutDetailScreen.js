import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  TX_STATUS as P,
  TX_STATUS_LABEL,
  TX_STATUS_TONE,
} from "@/constants/wallet";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { KeyValueTable } from "@/features/consignment/components/KeyValueTable";
import { toDate } from "@/features/orders/utils/time";
import { usePayout, useWallet } from "../hooks/useWallet";

const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");
const toWallet = () => router.dismissTo("/wallet");

// VI-05 · Yêu cầu rút tiền: Đang xử lý → Thành công / Thất bại (tự cập nhật)
export default function PayoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = usePayout(id);
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const status = query.data?.status;
  const final = status === P.SUCCESS || status === P.FAILED;

  // Có kết quả → làm mới số dư, lịch sử, danh sách yêu cầu (không đụng chính yêu cầu này)
  useEffect(() => {
    if (!final) return;
    queryClient.invalidateQueries({ queryKey: ["wallet", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    queryClient.invalidateQueries({ queryKey: ["wallet", "payouts"] });
    queryClient.invalidateQueries({ queryKey: ["wallet", "config"] });
  }, [final]);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = (
    <AppHeader
      title={
        query.data?.code ? `Yêu cầu ${query.data.code}` : "Yêu cầu rút tiền"
      }
      onBack={toWallet}
    />
  );
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
          <EmptyState
            icon="wallet-outline"
            title="Không tìm thấy yêu cầu rút"
          />
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

  const p = query.data;
  const steps = [
    {
      title: `Đã tạo yêu cầu · khoá ${formatVnd(p.amount)}`,
      desc: fmt(p.createdAt),
      state: "done",
    },
    {
      title: "Đang chi tiền",
      desc: status === P.PENDING ? "Chờ hệ thống xử lý" : "",
      state:
        status === P.PENDING
          ? "todo"
          : status === P.PROCESSING
            ? "active"
            : "done",
    },
    final
      ? {
          title:
            status === P.SUCCESS
              ? "Thành công — đã chuyển tiền"
              : "Thất bại — đã nhả tiền khoá",
          desc: fmt(p.processedAt),
          state: "done",
        }
      : {
          title: "Thành công hoặc thất bại",
          desc: "Thất bại thì tiền được nhả lại vào ví",
          state: "todo",
        },
  ];

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        status === P.FAILED ? (
          <View style={styles.footerRow}>
            <Button
              title="Tạo lại yêu cầu rút"
              onPress={() =>
                router.replace({
                  pathname: "/wallet/withdraw",
                  params: { amount: String(p.amount) },
                })
              }
              style={styles.flex}
            />
            <Button
              title="Về ví"
              variant="secondary"
              onPress={toWallet}
              style={styles.flex}
            />
          </View>
        ) : (
          <Button
            title="Về ví của tôi"
            variant="secondary"
            onPress={toWallet}
          />
        )
      }
    >
      <View style={styles.top}>
        <Text style={styles.muted}>Số tiền rút</Text>
        <Text
          style={[styles.amount, status === P.FAILED && styles.amountFailed]}
        >
          {formatVnd(p.amount)}
        </Text>
        <StatusChip
          label={TX_STATUS_LABEL[status] ?? status}
          tone={TX_STATUS_TONE[status]}
          style={styles.chip}
        />
      </View>

      {status === P.FAILED ? (
        <View style={styles.failBox}>
          <View style={styles.failHead}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.text}
            />
            <Text style={styles.boxTitle}>
              Giao dịch chi tiền không thành công
            </Text>
          </View>
          {p.failureReason ? (
            <Text style={styles.text}>
              Lý do hệ thống ghi nhận: {p.failureReason}
            </Text>
          ) : null}
          <View style={styles.innerBox}>
            <Text style={styles.strong}>Tiền đã được trả lại đầy đủ</Text>
            <Text style={styles.text}>
              {formatVnd(p.amount)} đã được nhả khỏi phần khoá và quay lại số dư
              khả dụng
              {p.processedAt ? ` lúc ${fmt(p.processedAt)}` : ""}. Bạn không mất
              đồng nào.
            </Text>
          </View>
        </View>
      ) : null}

      {status === P.SUCCESS ? (
        <NoteBox>{`Đã chuyển ${formatVnd(p.amount)}. Đây là giao dịch mô phỏng — ReHome không liên kết ngân hàng.`}</NoteBox>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRẠNG THÁI</Text>
        <StatusTimeline steps={steps} />
      </View>

      {!final ? (
        <>
          <KeyValueTable
            rows={[
              p.code && { label: "Mã yêu cầu", value: p.code },
              { label: "Tạo lúc", value: fmt(p.createdAt) },
              wallet.data && {
                label: "Khả dụng còn lại",
                value: formatVnd(wallet.data.availableBalance),
              },
            ].filter(Boolean)}
          />
          <NoteBox>
            {`Trong lúc chờ, ${formatVnd(p.amount)} bị khoá và không dùng để mua hàng hay tạo yêu cầu rút khác được. Màn này tự cập nhật khi có kết quả.`}
          </NoteBox>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  footerRow: { flexDirection: "row", gap: spacing.md },
  top: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  muted: { ...textStyles.body, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
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
  amountFailed: { color: colors.textSecondary },
  chip: { alignSelf: "center" },
  failBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tones.danger.fg,
    borderRadius: radius.input,
    backgroundColor: tones.danger.bg,
  },
  failHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  boxTitle: { flex: 1, ...textStyles.heading, color: colors.text },
  innerBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
});
