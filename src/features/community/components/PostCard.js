import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/utils/format";
import { LikeButton } from "./LikeButton";
import { PostPhotos } from "./PostPhotos";
import { VerifiedBadge } from "./VerifiedBadge";

// Bài viết ở CD-01 / CD-03. Nhãn "CHIẾN DỊCH" ẩn (0.5 A12)
export function PostCard({ post, onPress, onPressOrg, onLike }) {
  const org = post.organization;
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPressOrg}
        accessibilityRole="button"
        style={styles.head}
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
          <Text style={styles.muted}>
            {formatRelative(post.createdAt)}
            {org?.operationScopeLabel ? ` · ${org.operationScopeLabel}` : ""}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={styles.body}
      >
        <Text style={styles.content} numberOfLines={6}>
          {post.content}
        </Text>
        <PostPhotos urls={post.photoUrls} />
      </Pressable>

      <View style={styles.footer}>
        <LikeButton
          liked={post.likedByMe}
          count={post.likeCount}
          onPress={onLike}
        />
        <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
          <Text style={styles.text}>Bình luận {post.commentCount ?? 0}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  flex: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  body: { gap: spacing.sm, paddingHorizontal: spacing.md },
  content: { ...textStyles.body, color: colors.text },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  text: { ...textStyles.body, color: colors.text },
});
