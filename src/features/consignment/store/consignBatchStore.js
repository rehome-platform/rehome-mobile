import { create } from "zustand";

// "Lần gửi" đang soạn: 1 địa điểm ký gửi + nhiều món. Chỉ trong bộ nhớ (tắt app là mất) [CHỜ BE nháp → lưu server].
// warehouse: { id, name, address, … } — giữ cả tên / địa chỉ để hiện ở bước Xem lại
// Món: { key, group, categoryId, categoryName, brandId, brandName,
//        photos: { front, back, tag, defect, extra: [] }, productName, size, condition, desiredPrice, note }
const EMPTY = { warehouse: null, items: [] };

export const useConsignBatchStore = create((set) => ({
  ...EMPTY,
  setWarehouse: (warehouse) => set({ warehouse }),
  // Thêm mới (chưa có key) hoặc thay món cũ (cùng key)
  saveItem: (item) =>
    set((s) =>
      item.key && s.items.some((i) => i.key === item.key)
        ? { items: s.items.map((i) => (i.key === item.key ? item : i)) }
        : {
            items: [
              ...s.items,
              { ...item, key: item.key ?? `item-${Date.now()}` },
            ],
          },
    ),
  removeItem: (key) =>
    set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
  reset: () => set(EMPTY),
}));
