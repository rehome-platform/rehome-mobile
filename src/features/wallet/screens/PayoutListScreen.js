import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { TX_STATUS, TX_STATUS_LABEL } from "@/constants/wallet";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { toDate } from "@/features/orders/utils/time";
import { usePayouts } from "../hooks/useWallet";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/wallet");

// Danh sách yêu cầu rút tiền (API 78)
export default function PayoutListScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = usePayouts();
  if (!isAuthed) return <Redirect href="/login" />;

  return (
    <Screen
      header={<AppHeader title="Yêu cầu rút tiền" onBack={goBack} />}
      padded={false}
    >
      <FlatList
        data={query.data ?? []}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/wallet/payouts/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.amount}>{formatVnd(item.amount)}</Text>
              <Text style={styles.muted}>
                {[item.code, toDate(item.createdAt).format("DD/MM/YYYY HH:mm")]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <Text
              style={[
                styles.status,
                item.status !== TX_STATUS.SUCCESS && styles.statusStrong,
              ]}
            >
              {TX_STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          query.isPending ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : query.isError ? (
            <ErrorBox message={query.error.message}>
              <Button
                title="Thử lại"
                variant="secondary"
                onPress={() => query.refetch()}
              />
            </ErrorBox>
          ) : (
            <EmptyState
              icon="cash-outline"
              title="Chưa có yêu cầu rút tiền nào"
            />
          )
        }
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, paddingHorizontal: spacing.lg },
  flex: { flex: 1, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  pressed: { opacity: 0.7 },
  amount: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  status: { ...textStyles.caption, color: colors.textSecondary },
  statusStrong: { fontFamily: fonts.semibold, color: colors.text },
});
