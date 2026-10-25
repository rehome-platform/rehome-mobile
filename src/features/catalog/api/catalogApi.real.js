import { api, unwrap } from "@/lib/api/client";

// API 44 — public (Guest gọi được). Trả mảng {id, name, status}; danh mục có thêm tryonSlot (TOP/BOTTOM/DRESS/null)
export async function getCategories() {
  return unwrap(await api.get("/categories"));
}

export async function getBrands() {
  return unwrap(await api.get("/brands"));
}
