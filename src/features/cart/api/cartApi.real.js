import { api, unwrap } from "@/lib/api/client";

// API 52 — giỏ nhóm theo kho; món không còn ON_SALE có unavailableReason, không tính vào subtotal/totalAmount
export async function getCart() {
  return unwrap(await api.get("/cart"));
}

// API 51 — 409 "Sản phẩm không còn để bán." / "Sản phẩm đã có trong giỏ hàng." (chưa có code); id sai → 404
export async function addToCart(productId) {
  return unwrap(await api.post("/cart/items", { productId }));
}

// API 53
export async function removeCartItem(cartItemId) {
  return unwrap(await api.delete(`/cart/items/${cartItemId}`));
}
