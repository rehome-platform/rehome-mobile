import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { formatChatTime, isWarehouse, previewOf } from "../utils/chatRules";

// Một dòng ở CH-01: avatar · tên + nhãn · giờ tin cuối · tin cuối ("Bạn: …") · số chưa đọc
export function ConversationRow({ conv, onPress }) {
  const unread = conv.unreadCount > 0;
  const name = conv.counterpart?.displayName ?? "Hội thoại";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        unread && styles.rowUnread,
        pressed && styles.pressed,
      ]}
    >
      {isWarehouse(conv) ? (
        <View style={styles.whIcon}>
          <Ionicons name="business-outline" size={24} color={colors.primary} />
        </View>
      ) : (
        <Avatar
          uri={conv.counterpart?.avatarUrl}
          name={name}
          size={48}
          initialOf="first"
        />
      )}
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {isWarehouse(conv) ? (
            <Text style={styles.tag}>Hộp thư kho</Text>
          ) : conv.counterpart?.verified ? (
            <Text style={styles.tag}>Đã xác minh</Text>
          ) : null}
          <Text style={styles.time}>
            {formatChatTime(conv.lastMessage?.createdAt)}
          </Text>
        </View>
        <View style={styles.bottom}>
          <Text
            style={[styles.preview, unread && styles.previewUnread]}
            numberOfLines={1}
          >
            {previewOf(conv)}
          </Text>
          {unread ? <Text style={styles.badge}>{conv.unreadCount}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  rowUnread: { backgroundColor: colors.background },
  pressed: { opacity: 0.8 },
  whIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral,
  },
  body: { flex: 1, gap: 2 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    ...textStyles.label,
    color: colors.textSecondary,
  },
  time: {
    marginLeft: "auto",
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  bottom: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  preview: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  previewUnread: { fontFamily: fonts.semibold, color: colors.text },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    overflow: "hidden",
    textAlign: "center",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.text,
  },
});
