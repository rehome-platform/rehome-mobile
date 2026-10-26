import { create } from "zustand";

// Giữ dữ liệu cả 4 bước: quay lại bước trước không mất dữ liệu; bước Xem lại đọc từ đây.
// Chỉ nằm trong bộ nhớ (tắt app là mất) — đủ cho một lần đăng ký.
// mode: "create" (nộp lần đầu → POST) | "resubmit" (bị từ chối, nộp lại → PUT /me/registration)
const EMPTY = {
  mode: "create",
  info: null,
  representative: null,
  documents: null,
  location: null,
};

export const useOrgRegisterStore = create((set) => ({
  ...EMPTY,
  // key: "info" | "representative" | "documents" | "location"
  saveStep: (key, data) => set({ [key]: data }),
  setMode: (mode) => set({ mode }),
  reset: () => set(EMPTY),
}));
