import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";

// Hiện trực tiếp mật khẩu mới đạt điều kiện nào (AU-06, AU-07).
// Truyền currentPassword (AU-07) → thêm dòng "Khác mật khẩu hiện tại"
export function PasswordChecklist({ password = "", currentPassword }) {
  const rules = [
    { label: "Ít nhất 8 ký tự", ok: password.length >= 8 },
    {
      label: "Có chữ và số",
      ok: /[A-Za-z]/.test(password) && /\d/.test(password),
    },
  ];
  if (currentPassword !== undefined) {
    rules.push({
      label: "Khác mật khẩu hiện tại",
      ok: password.length > 0 && password !== currentPassword,
    });
  }

  return (
    <View style={styles.list}>
      {rules.map((rule) => (
        <View
          key={rule.label}
          style={styles.row}
          accessibilityLabel={`${rule.label}: ${rule.ok ? "đạt" : "chưa đạt"}`}
        >
          <Ionicons
            name={rule.ok ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={rule.ok ? colors.success : colors.textSecondary}
          />
          <Text style={[styles.text, rule.ok && styles.textOk]}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { ...textStyles.body, color: colors.textSecondary },
  textOk: { fontFamily: fonts.medium, color: colors.text },
});
