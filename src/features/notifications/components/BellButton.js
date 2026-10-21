import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { useUnreadNotifications } from "../hooks/useNotifications";

// Chuông + số chưa đọc ở header (tab Cá nhân; phía tổ chức đặt ở tab Hồ sơ). href khác nhau theo vai
export function BellButton({ href = "/notifications" }) {
  const unread = useUnreadNotifications();
  const n = unread.data ?? 0;
  return (
    <Pressable
      onPress={() => router.push(href)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={n ? `Thông báo, ${n} chưa đọc` : "Thông báo"}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {n ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{n > 99 ? "99+" : n}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: spacing.xs },
  pressed: { opacity: 0.6 },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
  },
  badgeText: {
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
