import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/utils/format";

// Một bình luận (CD-02, OB-05). Của mình → tên "Bạn". Thích / Trả lời / Sửa · Xoá ẩn (0.5 A14)
export function CommentItem({ comment: c }) {
  const name = c.isMine ? "Bạn" : c.author?.fullName;
  return (
    <View style={styles.row}>
      <Avatar uri={c.author?.avatarUrl} name={name} size={36} />
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{formatRelative(c.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{c.content}</Text>
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
});
