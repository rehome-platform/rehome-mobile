import { create } from "zustand";
import { MODEL_TYPE } from "@/constants/tryon";
import { slotKey, slotOf } from "../utils/tryonRules";

const EMPTY = { top: null, bottom: null, dress: null };

// Bộ đồ đang ghép ở phòng thử đồ (AI-01 ↔ AI-02). Chỉ RAM; nhớ người mẫu đã chọn trong lúc dùng app
export const useTryonDraftStore = create((set) => ({
  baseId: null, // món đang xem (khoá slot)
  modelType: MODEL_TYPE.FEMALE, // [GIẢ ĐỊNH] mặc định Nữ
  outfit: EMPTY,

  // Mở phòng với món đang xem: khác món lần trước → bắt đầu bộ mới; cùng món → giữ món đã chọn
  open: (product) =>
    set((s) =>
      s.baseId === product.id
        ? s
        : {
            baseId: product.id,
            outfit: { ...EMPTY, [slotKey(slotOf(product))]: product },
          },
    ),
  setModelType: (modelType) => set({ modelType }),
  pick: (product) =>
    set((s) => ({
      outfit: { ...s.outfit, [slotKey(slotOf(product))]: product },
    })),
  remove: (slot) =>
    set((s) => ({ outfit: { ...s.outfit, [slotKey(slot)]: null } })),
}));
