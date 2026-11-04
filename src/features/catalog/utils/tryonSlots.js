import { catalogApi } from "../api/catalogApi";

// Loại thử đồ (TOP / BOTTOM / DRESS) nằm ở danh mục (Category.tryonSlot); sản phẩm BE không trả kèm.
// → tải danh mục 1 lần mỗi phiên, tra theo categoryId. Lỗi mạng thì lần sau tải lại
let cache = null;

// → { [categoryId]: slot } (chỉ danh mục thử được)
export function getTryonSlots() {
  if (!cache) {
    cache = catalogApi
      .getCategories()
      .then((list) => {
        // Rỗng (BE đang dựng lại dữ liệu) → không giữ, lần sau tải lại
        if (!list?.length) cache = null;
        return Object.fromEntries(
          (list ?? [])
            .filter((c) => c.tryonSlot)
            .map((c) => [c.id, c.tryonSlot]),
        );
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

// Các danh mục thuộc một loại thử đồ
export async function categoryIdsOfSlot(slot) {
  const slots = await getTryonSlots();
  return Object.keys(slots).filter((id) => slots[id] === slot);
}
