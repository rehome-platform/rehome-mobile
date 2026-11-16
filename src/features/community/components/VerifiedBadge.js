import { StyleSheet, Text } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";

// Nhãn "Đã xác minh" cạnh tên tổ chức (chỉ tổ chức VERIFIED mới hiện ở Cộng đồng)
export function VerifiedBadge() {
  return <Text style={styles.badge}>Đã xác minh</Text>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
