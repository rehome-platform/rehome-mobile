import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import {
  campaignTitleOf,
  isCampaignOpen,
} from "@/features/community/utils/communityRules";
import { useMyCampaign } from "@/features/orgPortal/hooks/useMyCampaign";
import { useDonationNotes } from "@/features/orgPortal/hooks/useDonationNotes";

// OC-08 xem lại · Note quyên góp đã ghi của một chiến dịch (nhận tại địa chỉ riêng), mới nhất trước.
// Chiến dịch đã đóng vẫn xem được, chỉ ẩn "Ghi note mới". Note chỉ để tổ chức tự ghi nhớ — không sửa / xoá
function NoteCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text
          style={[styles.donor, item.isAnonymous && styles.anon]}
          numberOfLines={1}
        >
          {item.isAnonymous ? "Ẩn danh" : item.donorName}
        </Text>
        <Text style={styles.time}>
          {dayjs(item.createdAt).format("HH:mm DD/MM/YYYY")}
        </Text>
      </View>
      {item.note ? (
        <Text style={styles.note}>{item.note}</Text>
      ) : (
        <Text style={styles.noNote}>Không ghi thêm gì</Text>
      )}
    </View>
  );
}

export default function DonationNotesScreen() {
  const { id } = useLocalSearchParams();
  const campaign = useMyCampaign(id);
  const query = useDonationNotes(id);
  const items = query.data?.items ?? [];
  const open = isCampaignOpen(campaign.data);
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace(`/org/my-campaigns/${id}`);
  const openNew = () => router.push(`/org/my-campaigns/${id}/donation-note`);

  let empty;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        {query.error.code === "NOTES_NOT_READY" ? null : (
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        )}
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState
        icon="document-text-outline"
        title="Chưa có note nào"
        description={
          open
            ? "Khi có người mang đồ tới địa chỉ của bạn, bấm Ghi note mới để tự ghi lại."
            : "Chiến dịch này không có note nào được ghi."
        }
      />
    );
  }

  return (
    <Screen
      header={
        <View>
          <AppHeader title="Note quyên góp" onBack={goBack} />
          {campaign.data ? (
            <View style={styles.strip}>
              <Text style={styles.stripText} numberOfLines={1}>
                {campaignTitleOf(campaign.data)}
                {query.data ? ` · ${query.data.total} note` : ""}
              </Text>
            </View>
          ) : null}
        </View>
      }
      footer={open ? <Button title="Ghi note mới" onPress={openNew} /> : null}
      padded={false}
    >
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NoteCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={query.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  stripText: { ...textStyles.caption, color: colors.textSecondary },
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  donor: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  anon: { fontStyle: "italic", color: colors.textSecondary },
  time: { ...textStyles.caption, color: colors.textSecondary },
  note: { ...textStyles.body, color: colors.text },
  noNote: {
    ...textStyles.caption,
    fontStyle: "italic",
    color: colors.textSecondary,
  },
});
