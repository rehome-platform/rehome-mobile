import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// OB-01: thẻ bài viết đã đăng — ảnh đầu · ngày · nhãn Chiến dịch · nội dung 2 dòng · ⋯ ;
// hàng dưới: ♥ · Bình luận · "n bị báo cáo". Bấm thẻ → bình luận (OB-05)
export function OrgPostCard({ post: p, onPress, onMenu }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.thumb}>
          {p.photoUrls[0] ? (
            <Image
              source={{ uri: p.photoUrls[0] }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.metaRow}>
            <Text style={styles.muted}>
              {dayjs(p.createdAt).format("DD/MM")}
            </Text>
            {p.campaignId ? (
              <Text style={styles.tag} numberOfLines={1}>
                Chiến dịch
              </Text>
            ) : null}
          </View>
          <Text style={styles.content} numberOfLines={2}>
            {p.content}
          </Text>
        </View>
        <Pressable
          onPress={onMenu}
          accessibilityRole="button"
          accessibilityLabel="Tuỳ chọn bài viết"
          hitSlop={12}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.stat}>♥ {p.likeCount}</Text>
        <Text style={styles.stat}>Bình luận {p.commentCount}</Text>
        {p.reportCount > 0 ? (
          <Text style={styles.report}>{p.reportCount} bị báo cáo</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  info: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  content: { ...textStyles.body, color: colors.text },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  stat: { ...textStyles.caption, color: colors.textSecondary },
  report: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
