import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import {
  campaignDaysLeft,
  campaignTitleOf,
  isCampaignOpen,
} from "../utils/communityRules";

// Thẻ chiến dịch (CD-01 chip Chiến dịch, CD-03). Đã đóng → mờ
export function CampaignCard({ campaign: c, onPress, showOrg = true }) {
  const open = isCampaignOpen(c);
  const left = campaignDaysLeft(c);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        !open && styles.closed,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.thumb}>
        {c.coverUrl ? (
          <Image source={{ uri: c.coverUrl }} style={StyleSheet.absoluteFill} />
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {campaignTitleOf(c)}
        </Text>
        {showOrg && c.organization ? (
          <Text style={styles.muted} numberOfLines={1}>
            {c.organization.displayName}
          </Text>
        ) : null}
        <Text style={styles.muted}>
          {open
            ? `Nhận tới ${dayjs(c.endTime).format("DD/MM")} · còn ${Math.max(0, left)} ngày`
            : `Đã đóng ${dayjs(c.endTime).format("DD/MM")}`}
        </Text>
      </View>
      <Text style={[styles.tag, !open && styles.tagClosed]}>
        {open ? "ĐANG NHẬN" : "ĐÃ ĐÓNG"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  closed: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
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
    backgroundColor: colors.text,
  },
  tagClosed: {
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
});
