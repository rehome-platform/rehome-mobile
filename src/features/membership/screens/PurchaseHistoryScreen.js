import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { PAYMENT_METHOD_LABEL } from "@/constants/order";
import {
  BILLING_CYCLE_LABEL,
  PURCHASE_STATUS_LABEL,
  PURCHASE_STATUS_TONE,
} from "@/constants/membership";
import { usePurchaseHistory } from "../hooks/useMembership";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/membership/me");
const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");

// Lịch sử mua gói (/membership/history) — mới nhất trước
export default function PurchaseHistoryScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = usePurchaseHistory();
  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Lịch sử mua gói" onBack={goBack} />;
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
        <ErrorBox message={query.error.message}>
          <Button title="Thử lại" variant="secondary" onPress={() => query.refetch()} />
        </ErrorBox>
      </Screen>
    );
  }

  return (
    <Screen header={header} padded={false}>
      <FlatList
        data={query.data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item: p }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>
                {p.tierName} · {BILLING_CYCLE_LABEL[p.billingCycle] ?? ""}
              </Text>
              <StatusChip
                label={PURCHASE_STATUS_LABEL[p.status] ?? p.status}
                tone={PURCHASE_STATUS_TONE[p.status] ?? "neutral"}
              />
            </View>
            <Text style={styles.amount}>{formatVnd(p.amount)}</Text>
            <Text style={styles.line}>
              {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
              {p.paidAt ? ` · trả ${dayjs(p.paidAt).format("HH:mm DD/MM/YYYY")}` : ""}
            </Text>
            {p.startedAt ? (
              <Text style={styles.line}>
                Hiệu lực {fmt(p.startedAt)} → {fmt(p.expiresAt)}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Chưa mua gói nào"
            description="Các lần mua và gia hạn gói thành viên sẽ hiện ở đây."
          />
        }
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  sep: { height: spacing.md },
  card: {
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  name: { flex: 1, ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  amount: { ...textStyles.heading, color: colors.primary },
  line: { ...textStyles.caption, color: colors.textSecondary },
});
