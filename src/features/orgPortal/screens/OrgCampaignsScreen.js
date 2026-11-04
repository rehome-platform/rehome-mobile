import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { BellButton } from "@/features/notifications/components/BellButton";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { SearchBar } from "@/components/ui/SearchBar";
import { matchesSearch } from "@/utils/search";
import { CAMPAIGN_STATUS, ORG_LIMITS } from "@/constants/community";
import { useMyCampaigns } from "@/features/orgPortal/hooks/useMyCampaigns";
import { OrgCampaignCard } from "@/features/orgPortal/components/OrgCampaignCard";
import {
  canCreateCampaign,
  openCampaignCount,
} from "@/features/orgPortal/utils/campaignRules";

// OC-01 · Chiến dịch của tổ chức: chip Đang diễn ra / Đã đóng (kèm số), thẻ chiến dịch,
// footer Tạo chiến dịch mới — mờ khi đã đủ ORG_LIMITS.MAX_OPEN_CAMPAIGNS chiến dịch đang nhận
export default function OrgCampaignsScreen() {
  const query = useMyCampaigns();
  const [tab, setTab] = useState(CAMPAIGN_STATUS.OPEN);
  const [keyword, setKeyword] = useState("");
  const listRef = useRef(null);

  const all = query.data ?? [];
  const openCount = openCampaignCount(all);
  const chips = [
    { value: CAMPAIGN_STATUS.OPEN, label: `Đang diễn ra · ${openCount}` },
    {
      value: CAMPAIGN_STATUS.CLOSED,
      label: `Đã đóng · ${all.length - openCount}`,
    },
  ];
  // Ô tìm lọc trên máy trong chip đang chọn (tên + mô tả, không phân biệt dấu); số trên chip vẫn là tổng
  const campaigns = all.filter(
    (c) => c.status === tab && matchesSearch(keyword, c.title, c.description),
  );
  const canCreate = canCreateCampaign(all);

  const changeTab = (value) => {
    setTab(value);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  let empty;
  if (keyword.trim() && query.isSuccess) {
    empty = (
      <EmptyState
        icon="search-outline"
        title="Không tìm thấy chiến dịch"
        description={`Không có chiến dịch ${tab === CAMPAIGN_STATUS.OPEN ? "đang diễn ra" : "đã đóng"} nào khớp “${keyword.trim()}”.`}
      />
    );
  } else if (query.isPending) {
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
  } else if (tab === CAMPAIGN_STATUS.OPEN) {
    empty = (
      <EmptyState
        icon="megaphone-outline"
        title="Chưa có chiến dịch đang nhận đồ"
        description="Tạo chiến dịch để kêu gọi mọi người mang đồ tới cho tổ chức."
      />
    );
  } else {
    empty = (
      <EmptyState icon="archive-outline" title="Chưa có chiến dịch đã đóng" />
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Chiến dịch của tổ chức"
          right={<BellButton href="/org/notifications" />}
        />
      }
      edges={["top"]}
      padded={false}
      footer={
        query.isSuccess ? (
          <View style={styles.footer}>
            <Button
              title="Tạo chiến dịch mới"
              disabled={!canCreate}
              onPress={() => router.push("/org/my-campaigns/new")}
            />
            {!canCreate ? (
              <Text style={styles.lockNote}>
                Khoá vì đang có {openCount} / {ORG_LIMITS.MAX_OPEN_CAMPAIGNS}{" "}
                chiến dịch
              </Text>
            ) : null}
          </View>
        ) : null
      }
    >
      <View style={styles.searchWrap}>
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm theo tên chiến dịch…"
        />
      </View>
      <ChipGroup
        horizontal
        options={chips}
        value={tab}
        onChange={changeTab}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />
      <FlatList
        ref={listRef}
        data={campaigns}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <OrgCampaignCard
            campaign={item}
            onPress={() => router.push(`/org/my-campaigns/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
  footer: { gap: spacing.xs },
  lockNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
