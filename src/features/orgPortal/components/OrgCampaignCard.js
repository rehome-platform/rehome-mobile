import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import {
  campaignDaysLeft,
  campaignTitleOf,
  isCampaignOpen,
} from "@/features/community/utils/communityRules";
import { closedLabel, isCampaignHidden } from "../utils/campaignRules";

// OC-01: thẻ chiến dịch của tổ chức — ảnh bìa · tên · nhãn · hạn nhận · nút Xem
// (wireframe ghi "Mở" — dễ hiểu nhầm là mở lại chiến dịch đã đóng).
// Bỏ dòng "lượt thích · bình luận" của wireframe: chiến dịch không có số này (B1). Bấm cả thẻ cũng mở
export function OrgCampaignCard({ campaign: c, onPress }) {
  const open = isCampaignOpen(c);
  const hidden = isCampaignHidden(c);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.thumb}>
          {c.coverUrl ? (
            <Image
              source={{ uri: c.coverUrl }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {campaignTitleOf(c)}
          </Text>
          <Text style={[styles.muted, hidden && styles.hiddenText]}>
            {hidden
              ? "Bị ẩn do vi phạm · mở để xem lý do"
              : open
                ? `Nhận tới ${dayjs(c.endTime).format("DD/MM")} · còn ${Math.max(0, campaignDaysLeft(c))} ngày`
                : closedLabel(c)}
          </Text>
        </View>
        <Text
          style={[
            styles.tag,
            !open && styles.tagClosed,
            hidden && styles.tagHidden,
          ]}
        >
          {hidden ? "BỊ ẨN" : open ? "ĐANG NHẬN" : "ĐÃ ĐÓNG"}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}
        >
          <Text style={styles.openText}>Xem</Text>
        </Pressable>
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
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  info: { flex: 1, gap: 2 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  tagClosed: {
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  tagHidden: { color: colors.error, borderColor: colors.error },
  hiddenText: { color: colors.error },
  bottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  openBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.input,
  },
  openText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
