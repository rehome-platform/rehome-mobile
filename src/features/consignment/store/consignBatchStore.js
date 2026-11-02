import { create } from "zustand";

// "Lần gửi" đang soạn: 1 địa điểm ký gửi + nhiều món. Mỗi món đã "Lưu món" là 1 NHÁP trên server (draftId) →
// tắt app không mất; mở lại "Ký gửi món mới" thì tải nháp về store này. Kho chỉ chọn lúc gửi (POST /submit).
// warehouse: { id, name, address, … } — giữ cả tên / địa chỉ để hiện ở bước Xem lại
// Món: { key, draftId, group, categoryId, categoryName, brandId, brandName,
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
