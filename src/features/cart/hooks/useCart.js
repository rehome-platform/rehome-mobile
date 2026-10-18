import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { cartApi } from "../api/cartApi";
import { cartKeys } from "../api/queryKeys";

// Giỏ của Member đang đăng nhập. Guest không gọi API (BE trả 401)
export function useCart() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: cartApi.getCart,
    enabled: isAuthed,
  });
}

// Mọi món trong giỏ (kể cả không khả dụng), bỏ nhóm kho
export const cartItems = (cart) =>
  cart?.groupedByWarehouse?.flatMap((g) => g.items) ?? [];

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => cartApi.addToCart(productId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId) => cartApi.removeCartItem(cartItemId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}
