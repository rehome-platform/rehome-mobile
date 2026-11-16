import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { ChatButton } from "@/features/chat/components/ChatButton";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { BellButton } from "@/features/notifications/components/BellButton";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { FEED_SCOPE as F } from "@/constants/community";
import {
  useFeed,
  useOpenCampaigns,
  useToggleLike,
} from "../hooks/useCommunity";
import { PostCard } from "../components/PostCard";
import { CampaignCard } from "../components/CampaignCard";

// CD-01 · Tab Cộng đồng. Guest xem được, không có chip "Đang theo dõi"
export default function CommunityScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [chosen, setChosen] = useState(F.ALL);
  const scope = !isAuthed && chosen === F.FOLLOWING ? F.ALL : chosen;
  const isCampaigns = scope === F.CAMPAIGNS;
  const feed = useFeed(scope, { enabled: !isCampaigns });
  const camps = useOpenCampaigns(isCampaigns);
  const toggleLike = useToggleLike();
  const query = isCampaigns ? camps : feed;
  const listRef = useRef(null);

  const chips = [
    { value: F.ALL, label: "Tất cả" },
    ...(isAuthed ? [{ value: F.FOLLOWING, label: "Đang theo dõi" }] : []),
    { value: F.CAMPAIGNS, label: "Chiến dịch" },
  ];

  const change = (v) => {
    setChosen(v);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onLike = (p) =>
    isAuthed
      ? toggleLike.mutate({ id: p.id, liked: p.likedByMe })
      : askLogin(
          "/community",
          "Đăng nhập để thích bài viết",
          "Đăng nhập để thích, bình luận và theo dõi tổ chức.",
        );

  const openNearby = () =>
    isAuthed
      ? router.push("/organizations/nearby")
      : askLogin("/community", "Đăng nhập để xem tổ chức gần bạn");

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
  } else if (scope === F.FOLLOWING) {
    empty = (
      <EmptyState
        icon="heart-outline"
        title="Bạn chưa theo dõi tổ chức nào"
        description="Xem tổ chức gần bạn để bắt đầu."
      >
        <Button title="Tổ chức gần bạn" onPress={openNearby} />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState
        icon="newspaper-outline"
        title={
          isCampaigns
            ? "Chưa có chiến dịch nào đang nhận đồ"
            : "Chưa có bài viết nào"
        }
      />
    );
  }

  return (
    <Screen
      edges={["top"]}
      padded={false}
      header={
        <AppHeader
          title="Cộng đồng"
          right={
            <View style={styles.headerActions}>
              <HeaderIconButton
                icon="location-outline"
                label="Tổ chức gần bạn"
                onPress={openNearby}
              />
              <BellButton />
              <ChatButton />
            </View>
          }
        />
      }
    >
      {/* Ô tìm "giả" như tab Mua sắm: bấm là sang màn tìm (bàn phím mở sẵn ở đó) */}
      <View style={styles.searchWrap}>
        <Pressable
          onPress={() => router.push("/community-search")}
          accessibilityRole="search"
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <Text style={styles.searchText} numberOfLines={1}>
            Tìm tổ chức, chiến dịch…
          </Text>
        </Pressable>
      </View>
      <ChipGroup
        horizontal
        options={chips}
        value={scope}
        onChange={change}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />
      <FlatList
        ref={listRef}
        data={query.data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) =>
          isCampaigns ? (
            <CampaignCard
              campaign={item}
              onPress={() => router.push(`/campaigns/${item.id}`)}
            />
          ) : (
            <PostCard
              post={item}
              onPress={() => router.push(`/posts/${item.id}`)}
              onPressOrg={() =>
                router.push(`/organizations/${item.organizationId}`)
              }
              onLike={() => onLike(item)}
            />
          )
        }
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loading: { marginTop: spacing.xxl },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  search: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  searchText: {
    flex: 1,
    ...textStyles.body,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.7 },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
});
