import { create } from "zustand";

// Giữ dữ liệu cả 4 bước: quay lại bước trước không mất dữ liệu; bước Xem lại đọc từ đây.
// Chỉ nằm trong bộ nhớ (tắt app là mất) — đủ cho một lần đăng ký.
const EMPTY = {
  info: null,
  representative: null,
  documents: null,
  location: null,
};

export const useOrgRegisterStore = create((set) => ({
  ...EMPTY,
  // key: "info" | "representative" | "documents" | "location"
  saveStep: (key, data) => set({ [key]: data }),
  reset: () => set(EMPTY),
}));
