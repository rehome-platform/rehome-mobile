import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius } from "@/theme";

// Nút icon trên header — MỘT kiểu duy nhất cho mọi màn (giỏ, chuông, tin nhắn, cài đặt, gần bạn, ⋯).
// Khung vuông 40, viền nhạt; badge > 0 → chấm đỏ có số (quá 99 → "99+"). label bắt buộc cho trình đọc màn hình
export function HeaderIconButton({ icon, label, onPress, badge = 0 }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${label}, ${badge}` : label}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.6 },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.error,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.onPrimary },
});
