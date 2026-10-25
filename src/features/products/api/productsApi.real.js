import { api, unwrap } from "@/lib/api/client";
import { cleanFilters } from "../utils/filters";

// API 49 — chỉ món ON_SALE, mới lên sàn trước. page bắt đầu từ 0
// [CHỜ BE] Render 868d933 vẫn đòi đăng nhập (401 với Guest) — đã báo BE permitAll
export async function getProducts(params = {}) {
  return unwrap(await api.get("/products", { params: cleanFilters(params) }));
}

// API 50 — BE trả photos là mảng URL, ngày kiểm định tên inspectionDate
// → đổi về hình dạng màn hình đang dùng ({url}, inspectedAt), màn hình không phải sửa
export async function getProduct(id) {
  const p = unwrap(await api.get(`/products/${id}`));
  return {
    ...p,
    photos: (p.photos ?? []).map((url) => ({ url })),
    inspectedAt: p.inspectionDate ?? null,
  };
}
