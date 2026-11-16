import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { formatRelative } from "@/utils/format";
import { COMMENT_LIMITS, CONTENT_STATUS } from "@/constants/community";
import { useAuthStore } from "@/stores/authStore";
import { LikeButton } from "@/features/community/components/LikeButton";
import { PostPhotos } from "@/features/community/components/PostPhotos";
import {
  useCreateComment,
  useMyPost,
  usePostComments,
  useTogglePostLike,
} from "@/features/orgPortal/hooks/usePosts";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/org/posts");

const COLLAPSED_LINES = 6;
const LONG_POST_CHARS = 300; // dài hơn mức này mới thu gọn + "Xem thêm"
const byTime = (a, b) => dayjs(a.createdAt).diff(b.createdAt);

// Danh sách phẳng → [{ root, replies[] }], cũ trước mới sau (bình luận mới nằm cuối, sát ô nhập — như Facebook)
function groupComments(list = []) {
  const roots = list.filter((c) => !c.parentId).sort(byTime);
  return roots.map((root) => ({
    root,
    replies: list.filter((c) => c.parentId === root.id).sort(byTime),
  }));
}

// Bài viết đầy đủ ở đầu màn (kiểu Facebook): tổ chức + thời gian · nội dung · chiến dịch · ảnh · ♥ / bình luận
function PostHeader({ post: p, org, onLike }) {
  const [expanded, setExpanded] = useState(false);
  const long = p.content.length > LONG_POST_CHARS;
  return (
    <View style={styles.post}>
      <View style={styles.author}>
        <Avatar
          uri={org?.logoUrl}
          name={org?.displayName}
          size={40}
          initialOf="first"
        />
        <View style={styles.flex}>
          <Text style={styles.authorName} numberOfLines={1}>
            {org?.displayName ?? "Tổ chức"}
          </Text>
          <Text style={styles.muted}>{formatRelative(p.createdAt)}</Text>
        </View>
      </View>

      <Pressable onPress={() => setExpanded((v) => !v)} disabled={!long}>
        <Text
          style={styles.content}
          numberOfLines={long && !expanded ? COLLAPSED_LINES : undefined}
        >
          {p.content}
        </Text>
        {long ? (
          <Text style={styles.more}>{expanded ? "Thu gọn" : "Xem thêm"}</Text>
        ) : null}
      </Pressable>

      {p.campaignTitle ? (
        <View style={styles.campaign}>
          <Ionicons name="megaphone-outline" size={14} color={colors.primary} />
          <Text style={styles.campaignText} numberOfLines={1}>
            Chiến dịch · {p.campaignTitle}
          </Text>
        </View>
      ) : null}

      <PostPhotos urls={p.photoUrls} />

      <View style={styles.stats}>
        <LikeButton
          withLabel
          liked={p.likedByMe}
          count={p.likeCount}
          onPress={onLike}
        />
        <View style={styles.statsRight}>
          {p.reportCount > 0 ? (
            <Text style={styles.report}>{p.reportCount} bị báo cáo</Text>
          ) : null}
          <Text style={styles.muted}>{p.commentCount} bình luận</Text>
        </View>
      </View>
    </View>
  );
}

// Một bình luận dạng bong bóng. isMine (tổ chức viết) → tên + logo tổ chức + nhãn "Tác giả".
// Bị Moderator ẩn (REMOVED) → "Người dùng ẩn", chữ nghiêng mờ, không trả lời được
function CommentBubble({ comment: c, org, small = false, onReply }) {
  const removed = c.status === CONTENT_STATUS.REMOVED;
  const name = removed
    ? "Người dùng ẩn"
    : c.isMine
      ? (org?.displayName ?? "Tổ chức")
      : c.author?.fullName;
  const avatar = removed ? null : c.isMine ? org?.logoUrl : c.author?.avatarUrl;
  return (
    <View
      style={[styles.comment, small && styles.reply, removed && styles.removed]}
    >
      <Avatar
        uri={avatar}
        name={removed ? "?" : name}
        size={small ? 28 : 32}
        initialOf={c.isMine ? "first" : "last"}
      />
      <View style={styles.flex}>
        <View style={styles.bubble}>
          <View style={styles.nameRow}>
            <Text style={styles.commentName} numberOfLines={1}>
              {name}
            </Text>
            {c.isMine ? <Text style={styles.authorTag}>Tác giả</Text> : null}
          </View>
          <Text style={[styles.commentText, removed && styles.removedText]}>
            {removed
              ? "Nội dung bình luận không phù hợp, đã bị ẩn."
              : c.content}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.muted}>{formatRelative(c.createdAt)}</Text>
          {!removed ? (
            <Pressable onPress={() => onReply(c, name)} hitSlop={8}>
              <Text style={styles.replyAction}>Trả lời</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// OB-05 · Bài viết + bình luận. Lead đồng ý L9 (01/11): tổ chức thả tim, bình luận, trả lời từng người
export default function PostCommentsScreen() {
  const { id } = useLocalSearchParams();
  const org = useAuthStore((s) => s.user);
  const post = useMyPost(id);
  const query = usePostComments(id);
  const like = useTogglePostLike();
  const send = useCreateComment(id);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, name } — đang trả lời ai
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const p = post.data;
  // Moderator gỡ do vi phạm (BE ee01f91): chỉ tổ chức thấy bài + lý do; bình luận đóng (BE trả 404)
  const removed = p?.status === CONTENT_STATUS.REMOVED;
  const threads = useMemo(() => groupComments(query.data), [query.data]);

  const startReply = (c, name) => {
    setReplyTo({ id: c.id, name });
    inputRef.current?.focus();
  };

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    send.mutate(
      { content, parentId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText("");
          // Bình luận gốc mới nằm cuối danh sách → cuộn xuống; trả lời thì giữ chỗ đang xem
          if (!replyTo) setTimeout(() => listRef.current?.scrollToEnd(), 300);
          setReplyTo(null);
        },
        onError: (e) => Alert.alert("Chưa gửi được", e.message),
      },
    );
  };

  let empty;
  if (removed) {
    empty = (
      <Text style={styles.empty}>
        Bài đã bị gỡ nên bình luận không còn hiển thị.
      </Text>
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
  } else {
    empty = (
      <Text style={styles.empty}>
        Chưa có bình luận. Hãy là người mở lời cho bài này.
      </Text>
    );
  }

  const composer = (
    <View style={styles.composer}>
      {replyTo ? (
        <View style={styles.replyBanner}>
          <Text style={styles.muted} numberOfLines={1}>
            Đang trả lời <Text style={styles.bold}>{replyTo.name}</Text>
          </Text>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <Text style={styles.cancel}>Huỷ</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <Avatar
          uri={org?.logoUrl}
          name={org?.displayName}
          size={32}
          initialOf="first"
        />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? `Trả lời ${replyTo.name}…` : "Viết bình luận…"}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={COMMENT_LIMITS.MAX_CHARS}
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          disabled={!text.trim() || send.isPending}
          accessibilityRole="button"
          accessibilityLabel="Gửi bình luận"
          hitSlop={8}
        >
          {send.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons
              name="send"
              size={22}
              color={text.trim() ? colors.primary : colors.textSecondary}
            />
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen
      header={
        <AppHeader
          title={p ? `Bình luận · ${p.commentCount}` : "Bình luận"}
          onBack={goBack}
        />
      }
      footer={p && !removed ? composer : null}
      padded={false}
    >
      <FlatList
        ref={listRef}
        ListHeaderComponent={
          p ? (
            <>
              {removed ? (
                <View style={styles.removedBox}>
                  <View style={styles.removedHead}>
                    <Ionicons
                      name="eye-off-outline"
                      size={20}
                      color={colors.error}
                    />
                    <Text style={styles.removedTitle}>
                      Bài viết đã bị gỡ do vi phạm
                    </Text>
                  </View>
                  <Text style={styles.removedReason}>
                    Lý do:{" "}
                    <Text style={styles.bold}>
                      {p.removalReason || "ReHome chưa ghi lý do cụ thể."}
                    </Text>
                  </Text>
                  <Text style={styles.muted}>
                    Member không còn thấy bài này. Cần trao đổi thêm, hãy nhắn
                    cho ReHome.
                  </Text>
                </View>
              ) : null}
              <PostHeader
                post={p}
                org={org}
                onLike={() => like.mutate({ id: p.id, liked: !p.likedByMe })}
              />
              <Text style={styles.sectionTitle}>Bình luận</Text>
            </>
          ) : null
        }
        data={threads}
        keyExtractor={(t) => t.root.id}
        renderItem={({ item }) => (
          <View>
            <CommentBubble comment={item.root} org={org} onReply={startReply} />
            {item.replies.map((r) => (
              <CommentBubble
                key={r.id}
                comment={r}
                org={org}
                small
                onReply={startReply}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || post.isRefetching}
            onRefresh={() => {
              post.refetch();
              query.refetch();
            }}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, paddingBottom: spacing.lg },
  removedBox: {
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  removedHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  removedTitle: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  removedReason: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  // Bài viết: nền trắng tràn ngang như một bài trên bảng tin
  post: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  author: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  authorName: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  content: {
    ...textStyles.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  more: {
    marginTop: spacing.xs,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  campaign: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  campaignText: {
    flexShrink: 1,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  statsRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  report: {
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  // Bình luận dạng bong bóng; câu trả lời thụt vào dưới bình luận gốc
  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  reply: { paddingLeft: spacing.lg + 40 },
  removed: { opacity: 0.6 },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  commentName: {
    flexShrink: 1,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  authorTag: {
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.caption,
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  commentText: { ...textStyles.body, color: colors.text },
  removedText: { fontStyle: "italic", color: colors.textSecondary },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 2,
    marginLeft: spacing.md,
  },
  replyAction: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // Ô viết bình luận cố định ở đáy
  composer: { gap: spacing.xs },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cancel: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral,
    ...textStyles.body,
    color: colors.text,
  },
});
