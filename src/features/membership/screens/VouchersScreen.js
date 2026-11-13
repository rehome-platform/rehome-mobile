import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { VOUCHER_STATUS, VOUCHER_TABS } from "@/constants/membership";
import { useMyMembership, useMyVouchers } from "../hooks/useMembership";
import { hasPaidPlan } from "../utils/membershipRules";
import { SegmentTabs } from "../components/SegmentTabs";
import { VoucherCard } from "../components/VoucherCard";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/membership/me");

const FOOTNOTE = {
  [VOUCHER_STATUS.UNUSED]:
    "Mỗi mã dùng được 30 ngày kể từ ngày nhận, mỗi lần thanh toán dùng 1 mã. Chọn mã ở bước thanh toán.",
  [VOUCHER_STATUS.EXPIRED]: "Mã hết hạn không dùng lại hoặc gia hạn được.",
};

// M-04 · Voucher của tôi (/vouchers): 3 tab Chưa dùng / Đã dùng / Hết hạn
export default function VouchersScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [tab, setTab] = useState(VOUCHER_STATUS.UNUSED);
  const query = useMyVouchers(tab);
  const mine = useMyMembership();

  if (!isAuthed) return <Redirect href="/login" />;

  const paid = hasPaidPlan(mine.data);
  const items = query.data?.items ?? [];
  const unused = mine.data?.voucherSummary?.unused;
  const tabs = VOUCHER_TABS.map((t) => ({
    ...t,
    label:
      t.key === VOUCHER_STATUS.UNUSED && unused != null
        ? `${t.label} · ${unused}`
        : t.key === tab && query.data
          ? `${t.label} · ${query.data.total}`
          : t.label,
  }));

  const empty = () => {
    if (tab !== VOUCHER_STATUS.UNUSED)
      return (
        <EmptyState
          icon="pricetags-outline"
          title={tab === VOUCHER_STATUS.USED ? "Chưa dùng mã nào" : "Không có mã hết hạn"}
        />
      );
    if (!paid)
      return (
        <EmptyState
          icon="pricetags-outline"
          title="Thành viên thường chưa có voucher"
          description="Mã giảm phí vận chuyển và giảm giá đơn hàng dành cho gói Bạc, Vàng và Kim cương."
        >
          <Button title="Xem các gói thành viên" onPress={() => router.push("/membership")} />
        </EmptyState>
      );
    return (
      <EmptyState
        icon="pricetags-outline"
        title="Đã dùng hết voucher"
        description="Mã mới được phát mỗi tháng khi gói của bạn còn hiệu lực."
      />
    );
  };

  return (
    <Screen header={<AppHeader title="Voucher của tôi" onBack={goBack} />} padded={false}>
      <SegmentTabs items={tabs} value={tab} onChange={setTab} style={styles.tabs} />
      {query.isPending ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : query.isError ? (
        <View style={styles.pad}>
          <ErrorBox message={query.error.message}>
            <Button title="Thử lại" variant="secondary" onPress={() => query.refetch()} />
          </ErrorBox>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => <VoucherCard voucher={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={empty}
          ListFooterComponent={
            items.length && FOOTNOTE[tab] ? (
              <Text style={styles.foot}>{FOOTNOTE[tab]}</Text>
            ) : null
          }
          onEndReached={() => query.hasNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshing={query.isRefetching}
          onRefresh={() => {
            query.refetch();
            mine.refetch();
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  loading: { marginTop: spacing.xxl },
  pad: { padding: spacing.lg },
  list: { flexGrow: 1, padding: spacing.lg },
  sep: { height: spacing.md },
  foot: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
