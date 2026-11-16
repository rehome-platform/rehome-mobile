import { router } from "expo-router";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
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
    <HeaderIconButton
      icon="cart-outline"
      label="Giỏ hàng, số món"
      badge={count}
      onPress={onPress}
    />
  );
}
