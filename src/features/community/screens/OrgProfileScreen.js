import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { showToast } from "@/utils/toast";
import { REPORT_TARGET } from "@/constants/community";
import {
  useFeed,
  useOrgCampaigns,
  useOrganization,
  useToggleFollow,
  useToggleLike,
} from "../hooks/useCommunity";
import { MESSAGE_SOON, mapsUrl, orgSubtitle } from "../utils/communityRules";
import { CampaignCard } from "../components/CampaignCard";
import { PostCard } from "../components/PostCard";
import { VerifiedBadge } from "../components/VerifiedBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");

// CD-03 · Hồ sơ tổ chức (công khai). Chỉ tổ chức đã xác minh — 404 = không còn hoạt động
export default function OrgProfileScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useOrganization(id);
  const campaigns = useOrgCampaigns(id);
  const posts = useFeed(null, { orgId: id });
  const toggleFollow = useToggleFollow();
  const toggleLike = useToggleLike();
  const [tab, setTab] = useState("CAMPAIGNS");
  const o = query.data;
  const here = `/organizations/${id}`;
  const needLogin = () =>
    askLogin(
      here,
      "Đăng nhập để tương tác",
      "Đăng nhập để theo dõi, nhắn tin và báo cáo.",
    );

  const header = (
    <AppHeader
      title="Tổ chức"
      onBack={goBack}
      right={
        o ? (
          <Button
            title="Báo cáo"
            variant="text"
            onPress={() =>
              isAuthed
                ? router.push({
                    pathname: "/report",
                    params: {
                      targetType: REPORT_TARGET.ORGANIZATION_ACCOUNT,
                      targetId: id,
                    },
                  })
                : needLogin()
            }
          />
        ) : null
      }
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
            icon="business-outline"
            title="Tổ chức không còn hoạt động trên ReHome"
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

  const point = o.donationPoint ?? {};
  const campaignList = campaigns.data ?? [];
  const postList = posts.data ?? [];
  const chips = [
    {
      value: "CAMPAIGNS",
      label: `Chiến dịch · ${o.campaignCount ?? campaignList.length}`,
    },
    { value: "POSTS", label: `Bài viết · ${o.postCount ?? postList.length}` },
  ];

  return (
    <Screen scroll header={header} contentStyle={styles.content}>
      <View style={styles.head}>
        <Avatar
          uri={o.logoUrl}
          name={o.displayName}
          size={64}
          initialOf="first"
        />
        <View style={styles.flex}>
          <Text style={styles.name}>{o.displayName}</Text>
          <View style={styles.badgeRow}>
            <VerifiedBadge />
            <Text style={styles.muted}>{orgSubtitle(o)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={o.isFollowing ? "Đang theo dõi" : "Theo dõi"}
          variant={o.isFollowing ? "secondary" : "primary"}
          onPress={() =>
            isAuthed
              ? toggleFollow.mutate({ orgId: id, following: o.isFollowing })
              : needLogin()
          }
          style={styles.flex}
        />
        <Button
          title="Nhắn tin"
          variant="secondary"
          onPress={() => (isAuthed ? showToast(MESSAGE_SOON) : needLogin())}
          style={styles.flex}
        />
      </View>

      {o.description ? <Text style={styles.text}>{o.description}</Text> : null}

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.muted}>Nhận đồ tại</Text>
          <Text style={[styles.strong, styles.flexRight]}>{point.address}</Text>
        </View>
        {point.receivingHours ? (
          <View style={styles.infoRow}>
            <Text style={styles.muted}>Giờ nhận</Text>
            <Text style={[styles.text, styles.flexRight]}>
              {point.receivingHours}
            </Text>
          </View>
        ) : null}
        {o.followerCount != null ? (
          <View style={styles.infoRow}>
            <Text style={styles.muted}>Người theo dõi</Text>
            <Text style={styles.text}>
              {o.followerCount.toLocaleString("vi-VN")}
            </Text>
          </View>
        ) : null}
        {point.address ? (
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => Linking.openURL(mapsUrl(point))}
          >
            Chỉ đường
          </Text>
        ) : null}
      </View>

      <ChipGroup options={chips} value={tab} onChange={setTab} />

      {tab === "CAMPAIGNS" ? (
        campaigns.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : campaignList.length ? (
          campaignList.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              showOrg={false}
              onPress={() => router.push(`/campaigns/${c.id}`)}
            />
          ))
        ) : (
          <Text style={styles.empty}>Tổ chức chưa có chiến dịch nào.</Text>
        )
      ) : posts.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : postList.length ? (
        <>
          {postList.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onPress={() => router.push(`/posts/${p.id}`)}
              onPressOrg={() => {}}
              onLike={() =>
                isAuthed
                  ? toggleLike.mutate({ id: p.id, liked: p.likedByMe })
                  : needLogin()
              }
            />
          ))}
          {posts.hasNextPage ? (
            <Button
              title="Xem thêm bài viết"
              variant="text"
              loading={posts.isFetchingNextPage}
              onPress={() => posts.fetchNextPage()}
            />
          ) : null}
        </>
      ) : (
        <Text style={styles.empty}>Tổ chức chưa đăng bài viết nào.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { ...textStyles.title, color: colors.text },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actions: { flexDirection: "row", gap: spacing.md },
  text: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  info: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  flexRight: { flex: 1, textAlign: "right" },
  empty: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
