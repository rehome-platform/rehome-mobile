import { api, unwrap } from "@/lib/api/client";
import { cleanFilters } from "../utils/filters";

// API 49 — public (Guest xem được), chỉ món ON_SALE, mới lên sàn trước. page bắt đầu từ 0
export async function getProducts(params = {}) {
  return unwrap(await api.get("/products", { params: cleanFilters(params) }));
}

// API 50 [CHỜ BE] — BE chưa có (đọc code 19/10). Có rồi thì đổi MOCK.productDetail = false
export async function getProduct(id) {
  return unwrap(await api.get(`/products/${id}`));
}
