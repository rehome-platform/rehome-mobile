import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { DONATION_STATUS, DONATION_STATUS_LABEL } from "@/constants/donation";
import {
  campaignTitleOf,
  mapsUrl,
} from "@/features/community/utils/communityRules";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";
import { useMyCampaign } from "@/features/orgPortal/hooks/useMyCampaign";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/org/campaigns");
const fmt = (t, pattern = "DD/MM · HH:mm") => dayjs(t).format(pattern);

function DonationCard({ donation: d }) {
  const handedOver = d.status === DONATION_STATUS.HANDED_OVER;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text
          style={[styles.donor, d.isAnonymous && styles.anonymous]}
          numberOfLines={1}
        >
          {d.isAnonymous ? "Ẩn danh" : d.donorName}
        </Text>
        <Text style={[styles.chip, handedOver && styles.chipDone]}>
          {DONATION_STATUS_LABEL[d.status]?.toUpperCase()}
        </Text>
      </View>
      {d.note ? <Text style={styles.note}>"{d.note}"</Text> : null}
      <Text style={styles.meta}>
        Ghi nhận {fmt(d.createdAt)}
        {d.recordedBy ? ` bởi ${d.recordedBy}` : ""}
        {handedOver && d.handedOverAt
          ? ` — đã bàn giao cho tổ chức ${fmt(d.handedOverAt, "DD/MM")}`
          : ""}
      </Text>
    </View>
  );
}

// OC-07 · Đơn chờ lấy (chỉ đọc): các lượt Moderator ghi nhận tại quầy cho MỘT chiến dịch ở MỘT kho,
// mới nhất ở trên, gồm cả lượt đã bàn giao (lead chốt 01/11). Không có số kg / số lượng
export default function DonationListScreen() {
  const { id, warehouseId } = useLocalSearchParams();
  const campaign = useMyCampaign(id);
  const query = useQuery({
    queryKey: orgContentKeys.donations(id, warehouseId),
    queryFn: () => orgContentApi.getDonations({ campaignId: id, warehouseId }),
    enabled: !!id && !!warehouseId,
  });

  const warehouse = campaign.data?.warehouses.find((w) => w.id === warehouseId);
  const donations = query.data ?? [];

  let empty;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => query.refetch()}
        />
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState
        icon="cube-outline"
        title="Chưa có ai mang đồ tới kho này"
        description="Khi nhân viên ReHome ghi nhận đồ quyên góp tại quầy, lượt đó sẽ hiện ở đây."
      />
    );
  }

  return (
    <Screen
      header={<AppHeader title="Đơn chờ lấy" onBack={goBack} />}
      padded={false}
    >
      <View style={styles.strip}>
        {campaign.data ? (
          <Text style={styles.stripCampaign} numberOfLines={1}>
            {campaignTitleOf(campaign.data)}
          </Text>
        ) : null}
        {warehouse ? (
          <View style={styles.stripRow}>
            <Text style={styles.stripWarehouse}>
              {warehouse.name} · {warehouse.address}
            </Text>
            <Button
              title="Chỉ đường"
              variant="text"
              onPress={() =>
                Linking.openURL(mapsUrl({ address: warehouse.address }))
              }
            />
          </View>
        ) : null}
      </View>

      <FlatList
        data={donations}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DonationCard donation={item} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          donations.length ? (
            <View style={styles.listHead}>
              <Text style={styles.listTitle}>
                GHI NHẬN TẠI QUẦY · {donations.length} ĐƠN
              </Text>
              <Text style={styles.muted}>mới nhất ở trên</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          donations.length ? (
            <NoteBox style={styles.footNote}>
              Tới quầy, nhân viên ReHome xác nhận bàn giao trên hệ thống — bạn
              không cần bấm gì trong app.
            </NoteBox>
          ) : null
        }
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
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
  strip: {
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  stripCampaign: { ...textStyles.caption, color: colors.textSecondary },
  stripRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stripWarehouse: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  list: { flexGrow: 1, padding: spacing.lg },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  listTitle: { ...textStyles.label, color: colors.textSecondary },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  gap: { height: spacing.md },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  donor: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  anonymous: { color: colors.textSecondary },
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  chipDone: { borderColor: colors.neutral, color: colors.textSecondary },
  note: { ...textStyles.body, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
  footNote: { marginTop: spacing.lg },
});
