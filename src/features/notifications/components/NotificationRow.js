import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { NOTIFICATION_ICON } from "@/constants/notification";

// Một thông báo: icon theo loại · tiêu đề (đậm + chấm khi chưa đọc) · nội dung 2 dòng · giờ
export function NotificationRow({ item: n, onPress }) {
  const t = dayjs(n.createdAt);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !n.isRead && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.dotCol}>
        {!n.isRead ? <View style={styles.dot} /> : null}
      </View>
      <Ionicons
        name={NOTIFICATION_ICON[n.type] ?? "notifications-outline"}
        size={22}
        color={colors.textSecondary}
      />
      <View style={styles.body}>
        <View style={styles.head}>
          <Text
            style={[styles.title, !n.isRead && styles.titleUnread]}
            numberOfLines={1}
          >
            {n.title}
          </Text>
          <Text style={styles.time}>
            {t.isSame(dayjs(), "day") ? t.format("HH:mm") : t.format("DD/MM")}
          </Text>
        </View>
        <Text style={styles.text} numberOfLines={2}>
          {n.body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  unread: { backgroundColor: colors.background },
  pressed: { opacity: 0.8 },
  dotCol: { width: spacing.lg, alignItems: "center", paddingTop: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  body: { flex: 1, gap: 2 },
  head: { flexDirection: "row", gap: spacing.sm },
  title: { flex: 1, ...textStyles.body, color: colors.text },
  titleUnread: { fontFamily: fonts.semibold },
  time: { ...textStyles.caption, color: colors.textSecondary },
  text: { ...textStyles.caption, color: colors.textSecondary },
});
