import { Pressable, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Bong bóng tin: của mình bên phải (nền đậm), đối tác bên trái. Đang gửi / lỗi "Gửi lại"
export function MessageBubble({ message: m, onRetry }) {
  const mine = m.isMine;
  return (
    <View style={[styles.wrap, mine ? styles.right : styles.left]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.mine : styles.theirs,
          m.failed && styles.failed,
        ]}
      >
        <Text style={mine ? styles.textMine : styles.text}>{m.content}</Text>
      </View>
      {m.failed ? (
        <Pressable
          onPress={() => onRetry?.(m)}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.error}>Chưa gửi được · Gửi lại</Text>
        </Pressable>
      ) : (
        <Text style={styles.time}>
          {m.pending ? "Đang gửi…" : dayjs(m.createdAt).format("HH:mm")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: "80%", gap: 2, marginVertical: spacing.xs },
  right: { alignSelf: "flex-end", alignItems: "flex-end" },
  left: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  mine: { backgroundColor: colors.primary },
  theirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  failed: { opacity: 0.6 },
  text: { ...textStyles.body, color: colors.text },
  textMine: { ...textStyles.body, color: colors.onPrimary },
  time: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
