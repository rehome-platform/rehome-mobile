import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/utils/format";
import { COMMENT_AUTHOR_TYPE, CONTENT_STATUS } from "@/constants/community";

// Một bình luận (CD-02). Của mình → tên "Bạn". Câu trả lời (parentId) thụt vào 1 cấp.
// Bị Moderator ẩn (REMOVED, content = null) → chữ mờ, không trả lời được. onReply có → hiện "Trả lời"
export function CommentItem({ comment: c, onReply }) {
  const name = c.isMine ? "Bạn" : c.author?.fullName;
  const isOrg = c.author?.type === COMMENT_AUTHOR_TYPE.ORGANIZATION;
  const removed = c.status === CONTENT_STATUS.REMOVED || c.content == null;
  return (
    <View style={[styles.row, c.parentId && styles.reply]}>
      <Avatar
        uri={c.author?.avatarUrl}
        name={name}
        size={c.parentId ? 28 : 36}
        initialOf={isOrg ? "first" : "last"}
      />
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{formatRelative(c.createdAt)}</Text>
        </View>
        {removed ? (
          <Text style={styles.removed}>Bình luận đã bị ẩn</Text>
        ) : (
          <Text style={styles.text}>{c.content}</Text>
        )}
        {onReply && !removed ? (
          <Text
            style={styles.replyLink}
            onPress={() => onReply(c)}
            accessibilityRole="button"
            suppressHighlighting
          >
            Trả lời
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  reply: { paddingLeft: spacing.xl, borderBottomWidth: 0 },
  removed: {
    ...textStyles.body,
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  body: { flex: 1, gap: 2 },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  time: { ...textStyles.caption, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
  replyLink: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: 2,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
});
