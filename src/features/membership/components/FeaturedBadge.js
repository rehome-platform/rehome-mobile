import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radius, spacing, textStyles, tones } from "@/theme";

// Nhãn "Nổi bật" — món của người ký gửi đang dùng gói có quyền ưu tiên hiển thị (BE trả featured = true).
// Màu cam nhạt trung tính, KHÔNG dùng chữ gợi ý chất lượng ("Chính hãng", "Uy tín") — mọi món đều đã qua kiểm định như nhau
export function FeaturedBadge({ style, small = false }) {
  return (
    <View style={[styles.badge, style]}>
      <Ionicons name="star" size={small ? 10 : 12} color={tones.warning.fg} />
      <Text style={[styles.text, small && styles.small]}>Nổi bật</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: tones.warning.bg,
  },
  text: { ...textStyles.label, fontFamily: fonts.semibold, color: tones.warning.fg },
  small: { fontSize: 10 },
});
