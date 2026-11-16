import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Khối tóm tắt một bước: tiêu đề + "Sửa" (về đúng bước) + nội dung
export function ReviewSection({ title, onEdit, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onEdit ? (
          <Text
            style={styles.edit}
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Sửa ${title}`}
          >
            Sửa
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// Một dòng "nhãn — giá trị". Bỏ trống → "—" để thấy rõ là không khai, không phải lỗi hiển thị
export function ReviewRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: { flex: 1, ...textStyles.heading, color: colors.text },
  edit: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  row: { flexDirection: "row", gap: spacing.md },
  label: { width: 116, ...textStyles.body, color: colors.textSecondary },
  value: { flex: 1, ...textStyles.body, color: colors.text },
});
