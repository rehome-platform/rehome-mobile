import { create } from "zustand";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { setOnSessionExpired } from "@/lib/api/client";
import { queryClient } from "@/lib/query/queryClient";
import { authApi } from "@/features/auth/api/authApi";
import { useCheckoutStore } from "@/stores/checkoutStore";

export const useAuthStore = create((set) => ({
  status: "loading", // 'loading' | 'guest' | 'authenticated'
  user: null,
  sessionError: null, // ApiError khi bị đăng xuất ngoài ý muốn (ví dụ ACCOUNT_BANNED) — AU-02 đọc để hiện

  // Mở app: còn refresh token thì thử lấy thông tin user (khôi phục phiên)
  bootstrap: async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (!refresh) return set({ status: "guest", user: null });
    try {
      const user = await authApi.getMe();
      set({ status: "authenticated", user });
    } catch (e) {
      // Token hỏng (401/403) → xoá. Mất mạng (status 0) → giữ token để lần sau thử lại
      if (e.status === 401 || e.status === 403) await tokenStorage.clear();
      set({ status: "guest", user: null });
    }
  },

  // Nhận token từ login → lưu → lấy thông tin user. Lỗi thì xoá token và ném lỗi ra cho màn hình
  signIn: async ({ accessToken, refreshToken }) => {
    await tokenStorage.save({ accessToken, refreshToken });
    try {
      const user = await authApi.getMe();
      set({ status: "authenticated", user, sessionError: null });
    } catch (e) {
      await tokenStorage.clear();
      throw e;
    }
  },

  signOut: async (reason = null) => {
    try {
      await authApi.logout(); // BE trả 500 nếu access token đã hết hạn — bỏ qua
    } catch {}
    await tokenStorage.clear();
    queryClient.clear(); // xoá dữ liệu cache của người cũ
    useCheckoutStore.getState().clear(); // đơn chờ thanh toán / địa chỉ đang chọn của người cũ
    set({ status: "guest", user: null, sessionError: reason });
  },

  clearSessionError: () => set({ sessionError: null }),
  setUser: (user) => set({ user }),
}));

// Refresh thất bại (refresh token hết hạn, bị khoá…) → client.js gọi hàm này → đăng xuất, giữ lý do
setOnSessionExpired((reason) => useAuthStore.getState().signOut(reason));
