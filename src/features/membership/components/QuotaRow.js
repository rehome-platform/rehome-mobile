import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Một dòng hạn mức ở "Gói của tôi": tên + "đã dùng / tổng" + thanh tiến độ.
// limit null = không giới hạn (ẩn thanh). value: chữ thay cho số (vd "Đang nổi bật 7 món", "Không có")
export function QuotaRow({ label, used, limit, note, value, muted = false }) {
  const hasBar = value == null && limit != null && limit > 0;
  const ratio = hasBar ? Math.min(1, (used ?? 0) / limit) : 0;
  const full = hasBar && ratio >= 1;
  const right =
    value ??
    (limit == null ? "Không giới hạn" : `${used ?? 0} / ${limit}`);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, muted && styles.muted]}>{label}</Text>
        <Text
          style={[styles.value, muted && styles.muted, full && styles.full]}
        >
          {right}
        </Text>
      </View>
      {hasBar ? (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${ratio * 100}%` },
              full && styles.fillFull,
            ]}
          />
        </View>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, paddingVertical: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { flex: 1, ...textStyles.body, color: colors.text },
  value: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { color: colors.textSecondary, fontFamily: fonts.regular },
  full: { color: colors.error },
  track: {
    height: 6,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
  },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  fillFull: { backgroundColor: colors.error },
  note: { ...textStyles.caption, color: colors.textSecondary },
});
