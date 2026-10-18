import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius } from "@/theme";
import { useAuthStore } from "@/stores/authStore";
import { setPendingRedirect } from "@/stores/pendingRedirect";
import { cartItems, useCart } from "../hooks/useCart";

// Icon giỏ + số món (header BR-01, BR-04). Guest bấm → đăng nhập → mở lại giỏ
export function CartButton() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const cart = useCart();
  const count = cartItems(cart.data).length;

  const onPress = () => {
    if (isAuthed) return router.push("/cart");
    setPendingRedirect("/cart");
    router.push("/login");
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={count ? `Giỏ hàng, ${count} món` : "Giỏ hàng"}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Ionicons name="cart-outline" size={22} color={colors.text} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
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
