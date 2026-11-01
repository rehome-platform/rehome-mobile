import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/utils/format";
import { PostPhotos } from "@/features/community/components/PostPhotos";

const COLLAPSED_LINES = 4;

// active: nút Thích khi đã thích → tim đỏ, chữ đậm
function Action({ icon, label, onPress, active = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? colors.error : colors.textSecondary}
      />
      <Text style={[styles.actionText, active && styles.actionActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// OB-01: bài viết kiểu bảng tin (như Facebook) — tổ chức + thời gian + ⋯ · nội dung 4 dòng · chiến dịch · ảnh ·
// ♥ / bình luận / "n bị báo cáo" · nút Thích (L9), Bình luận, Sửa. org = { displayName, logoUrl } của tổ chức đang đăng nhập
export function OrgPostCard({
  post: p,
  org,
  onLike,
  onComments,
  onEdit,
  onMenu,
}) {
  const [truncated, setTruncated] = useState(false);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar
          uri={org?.logoUrl}
          name={org?.displayName}
          size={40}
          initialOf="first"
        />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {org?.displayName ?? "Tổ chức"}
          </Text>
          <Text style={styles.muted}>{formatRelative(p.createdAt)}</Text>
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

      <Pressable onPress={onComments} style={styles.body}>
        <Text
          style={styles.content}
          numberOfLines={COLLAPSED_LINES}
          onTextLayout={(e) =>
            setTruncated(e.nativeEvent.lines.length >= COLLAPSED_LINES)
          }
        >
          {p.content}
        </Text>
        {truncated ? <Text style={styles.more}>Xem thêm</Text> : null}
        {p.campaignTitle ? (
          <View style={styles.campaign}>
            <Ionicons
              name="megaphone-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.campaignText} numberOfLines={1}>
              Chiến dịch · {p.campaignTitle}
            </Text>
          </View>
        ) : null}
        <PostPhotos urls={p.photoUrls} />
      </Pressable>

      <View style={styles.stats}>
        <Text style={styles.muted}>♥ {p.likeCount}</Text>
        <View style={styles.statsRight}>
          {p.reportCount > 0 ? (
            <Text style={styles.report}>{p.reportCount} bị báo cáo</Text>
          ) : null}
          <Text style={styles.muted}>{p.commentCount} bình luận</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Action
          icon={p.likedByMe ? "heart" : "heart-outline"}
          label="Thích"
          active={p.likedByMe}
          onPress={onLike}
        />
        <Action
          icon="chatbubble-outline"
          label="Bình luận"
          onPress={onComments}
        />
        <Action icon="create-outline" label="Sửa" onPress={onEdit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
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
  name: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  body: { gap: spacing.sm, paddingHorizontal: spacing.md },
  content: { ...textStyles.body, color: colors.text },
  more: {
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  actionActive: { color: colors.error },
  actionText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
});
