import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { formatRelative } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { COMMENT_LIMITS, REPORT_TARGET } from "@/constants/community";
import {
  useAddComment,
  useComments,
  usePost,
  useToggleFollow,
  useToggleLike,
} from "../hooks/useCommunity";
import { CommentItem } from "../components/CommentItem";
import { LikeButton } from "../components/LikeButton";
import { PostPhotos } from "../components/PostPhotos";
import { VerifiedBadge } from "../components/VerifiedBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");

// CD-02 · Bài viết + bình luận (/posts/<id>). Guest xem được; thích / bình luận / theo dõi / báo cáo cần đăng nhập
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = usePost(id);
  const comments = useComments(id);
  const toggleLike = useToggleLike();
  const toggleFollow = useToggleFollow();
  const add = useAddComment(id);
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const p = query.data;
  const here = `/posts/${id}`;

  const needLogin = () =>
    askLogin(
      here,
      "Đăng nhập để tương tác",
      "Đăng nhập để thích, bình luận, theo dõi và báo cáo.",
    );

  const header = (
    <AppHeader
      title="Bài viết"
      onBack={goBack}
      right={
        p ? (
          <Button
            title="Báo cáo"
            variant="text"
            onPress={() =>
              isAuthed
                ? router.push({
                    pathname: "/report",
                    params: { targetType: REPORT_TARGET.POST, targetId: id },
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
          <EmptyState icon="newspaper-outline" title="Bài viết không còn nữa" />
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

  const org = p.organization;
  const send = () => {
    const content = text.trim();
    if (!content) return;
    add.mutate(content, {
      onSuccess: () => {
        setText("");
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
      },
      onError: (e) => showToast(e.message),
    });
  };

  const postBlock = (
    <View style={styles.post}>
      <View style={styles.orgRow}>
        <Pressable
          onPress={() => router.push(`/organizations/${p.organizationId}`)}
          accessibilityRole="button"
          style={styles.orgInfo}
        >
          <Avatar
            uri={org?.logoUrl}
            name={org?.displayName}
            size={40}
            initialOf="first"
          />
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {org?.displayName}
              </Text>
              {org?.verified ? <VerifiedBadge /> : null}
            </View>
            <Text style={styles.muted}>{formatRelative(p.createdAt)}</Text>
          </View>
        </Pressable>
        <Button
          title={p.isFollowing ? "Đang theo dõi" : "Theo dõi"}
          variant={p.isFollowing ? "secondary" : "primary"}
          onPress={() =>
            isAuthed
              ? toggleFollow.mutate({
                  orgId: p.organizationId,
                  following: p.isFollowing,
                })
              : needLogin()
          }
          style={styles.smallBtn}
        />
      </View>
      <Text style={styles.content}>{p.content}</Text>
      <PostPhotos urls={p.photoUrls} />
      <View style={styles.stats}>
        <LikeButton
          withLabel
          liked={p.likedByMe}
          count={p.likeCount}
          onPress={() =>
            isAuthed
              ? toggleLike.mutate({ id: p.id, liked: p.likedByMe })
              : needLogin()
          }
        />
        <Text style={styles.muted}>Bình luận · {p.commentCount}</Text>
      </View>
    </View>
  );

  const composer = isAuthed ? (
    <View style={styles.composer}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Viết bình luận…"
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={COMMENT_LIMITS.MAX_CHARS}
        style={styles.input}
      />
      <Button
        title="Gửi"
        disabled={!text.trim()}
        loading={add.isPending}
        onPress={send}
        style={styles.sendBtn}
      />
    </View>
  ) : (
    <Pressable onPress={needLogin} style={[styles.input, styles.fakeInput]}>
      <Text style={styles.muted}>Đăng nhập để bình luận…</Text>
    </Pressable>
  );

  return (
    <Screen header={header} padded={false} footer={composer}>
      <FlatList
        ref={listRef}
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListHeaderComponent={postBlock}
        ListEmptyComponent={
          comments.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.muted, styles.noComment]}>
              Chưa có bình luận nào. Hãy là người đầu tiên.
            </Text>
          )
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (comments.hasNextPage && !comments.isFetchingNextPage)
            comments.fetchNextPage();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  flex: { flex: 1 },
  post: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  orgRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  orgInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  content: { ...textStyles.body, color: colors.text },
  stats: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  smallBtn: { minHeight: 36, paddingHorizontal: spacing.md },
  noComment: { paddingVertical: spacing.lg, textAlign: "center" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    ...textStyles.body,
    color: colors.text,
  },
  fakeInput: { justifyContent: "center", flex: 0 },
  sendBtn: { minHeight: 44, paddingHorizontal: spacing.lg },
});
