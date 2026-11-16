import { create } from "zustand";
import { MODEL_TYPE } from "@/constants/tryon";
import { slotKey, slotOf } from "../utils/tryonRules";

const EMPTY = { top: null, bottom: null, dress: null };

// Bộ đồ đang ghép ở phòng thử đồ (AI-01 ↔ AI-02). Chỉ RAM; nhớ người mẫu đã chọn trong lúc dùng app
export const useTryonDraftStore = create((set) => ({
  baseId: null, // món đang xem (khoá slot)
  modelType: MODEL_TYPE.FEMALE, // [GIẢ ĐỊNH] mặc định Nữ
  outfit: EMPTY,
  // AI phối đồ: id món đang nằm trong bộ vì AI gợi ý (hiện nhãn "AI gợi ý"); người dùng tự chọn → null
  aiPickedId: null,
  // Người dùng đã tự đổi / bỏ món ở ô còn thiếu → AI không tự điền lại nữa (tôn trọng lựa chọn của họ)
  userTouched: false,

  // Mở phòng với món đang xem: khác món lần trước → bắt đầu bộ mới; cùng món → giữ món đã chọn
  open: (product) =>
    set((s) =>
      s.baseId === product.id
        ? s
        : {
            baseId: product.id,
            outfit: { ...EMPTY, [slotKey(slotOf(product))]: product },
            aiPickedId: null,
            userTouched: false,
          },
    ),
  setModelType: (modelType) => set({ modelType }),
  // Người dùng tự chọn (màn chọn món)
  pick: (product) =>
    set((s) => ({
      outfit: { ...s.outfit, [slotKey(slotOf(product))]: product },
      aiPickedId: null,
      userTouched: true,
    })),
  // Chọn một món trong dải "AI gợi ý phối cùng" → vẫn là món AI gợi ý
  pickSuggested: (product) =>
    set((s) => ({
      outfit: { ...s.outfit, [slotKey(slotOf(product))]: product },
      aiPickedId: product.id,
      userTouched: true,
    })),
  // AI tự điền món hợp nhất vào ô còn thiếu — chỉ khi ô đó trống và người dùng chưa tự đụng tới
  autoFill: (baseId, product) =>
    set((s) => {
      const key = slotKey(slotOf(product));
      if (s.baseId !== baseId || s.userTouched || s.outfit[key]) return s;
      return {
        outfit: { ...s.outfit, [key]: product },
        aiPickedId: product.id,
      };
    }),
  remove: (slot) =>
    set((s) => ({
      outfit: { ...s.outfit, [slotKey(slot)]: null },
      aiPickedId: null,
      userTouched: true,
    })),
}));
