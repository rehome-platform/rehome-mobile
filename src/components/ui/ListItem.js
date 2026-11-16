import { Children, Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// muted: trông mờ (tính năng "Sắp có") nhưng VẪN bấm được để báo cho người dùng biết
export function ListItem({
  icon,
  title,
  description,
  badge,
  onPress,
  disabled = false,
  muted = false,
  danger = false,
  showChevron = true,
}) {
  const pressable = !!onPress && !disabled;
  const faded = disabled || muted;
  const iconColor = danger
    ? colors.error
    : faded
      ? colors.textSecondary
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!pressable}
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityState={{ disabled: !pressable }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        faded && styles.disabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={22} color={iconColor} /> : null}
      <View style={styles.texts}>
        <Text style={[styles.title, danger && styles.titleDanger]}>
          {title}
        </Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {pressable && showChevron && !muted ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

// Nhóm các ListItem: khung bo góc + đường kẻ mảnh giữa các dòng + tiêu đề nhóm (tuỳ chọn)
export function ListGroup({ title, children, style }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.groupWrap, style]}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.separator} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.background },
  disabled: { opacity: 0.55 },
  texts: { flex: 1, gap: 2 },
  title: {
    ...textStyles.body,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  titleDanger: { color: colors.error },
  desc: { ...textStyles.caption, color: colors.textSecondary },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
  },
  badgeText: { ...textStyles.label, color: colors.text },
  groupWrap: { gap: spacing.sm },
  groupTitle: {
    ...textStyles.label,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  group: {
    overflow: "hidden", // bo góc cắt luôn nền của từng dòng
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral,
    backgroundColor: colors.surface,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral,
    marginLeft: spacing.lg,
  },
});
