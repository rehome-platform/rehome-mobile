import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { FORM_STATUS } from "@/constants/consignment";
import { formatVnd } from "@/utils/money";
import { daysLeft } from "@/utils/consignment";
import { StatusBadge } from "./StatusBadge";

// "còn 6 ngày" / "hạn chót hôm nay" / "đã quá hạn"
const leftText = (n) =>
  n > 0 ? `còn ${n} ngày` : n === 0 ? "hạn chót hôm nay" : "đã quá hạn";

// Dòng phụ theo trạng thái. Thiếu field (BE chưa trả) → không hiện dòng đó
function Footer({ form }) {
  if (form.status === FORM_STATUS.PENDING && form.createdAt) {
    return (
      <Text style={styles.sub}>
        Gửi lúc {dayjs(form.createdAt).format("HH:mm DD/MM/YYYY")}
      </Text>
    );
  }
  if (form.status === FORM_STATUS.APPROVED && form.bringInDeadline) {
    const left = daysLeft(form.bringInDeadline);
    return (
      <View style={styles.todo}>
        <Ionicons
          name="time-outline"
          size={16}
          color={left <= 2 ? colors.error : colors.primary}
        />
        <Text style={[styles.todoText, left <= 2 && styles.urgent]}>
          Mang đồ đến địa điểm trước {dayjs(form.bringInDeadline).format("DD/MM")} ·{" "}
          {leftText(left)}
        </Text>
      </View>
    );
  }
  if (form.status === FORM_STATUS.REJECTED && form.rejectReason) {
    return (
      <Text style={styles.sub} numberOfLines={2}>
        Lý do: {form.rejectReason}
      </Text>
    );
  }
  if (form.status === FORM_STATUS.EXPIRED && form.bringInDeadline) {
    return (
      <Text style={styles.sub}>
        Quá hạn mang đồ đến địa điểm{" "}
        {dayjs(form.bringInDeadline).format("DD/MM/YYYY")}
      </Text>
    );
  }
  return null;
}

export function FormCard({ form, onPress }) {
  const faded =
    form.status === FORM_STATUS.EXPIRED ||
    form.status === FORM_STATUS.CANCELLED;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        faded && styles.faded,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        {form.thumbnailUrl ? (
          <Image source={{ uri: form.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumb}>
            <Ionicons
              name="shirt-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {form.productName}
          </Text>
          <StatusBadge status={form.status} />
          <Text style={styles.meta} numberOfLines={1}>
            Giá mong muốn {formatVnd(form.desiredPrice)}
            {form.warehouseName ? ` · ${form.warehouseName}` : ""}
          </Text>
        </View>
      </View>
      <Footer form={form} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  faded: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  row: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  info: { flex: 1, gap: spacing.xs },
  name: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  meta: { ...textStyles.caption, color: colors.textSecondary },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  todo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  todoText: {
    flex: 1,
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  urgent: { color: colors.error },
});
