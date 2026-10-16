import axios from "axios";
import { ENV } from "@/config/env";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { toApiError } from "./errors";

// Server Render ngủ khi không dùng: request đầu tiên có thể mất vài chục giây
export const api = axios.create({ baseURL: ENV.API_BASE_URL, timeout: 30000 });

// BE bọc { result, statusCode, message, isSuccess } ở /members; /api/auth trả thẳng
export const unwrap = (res) => res.data?.result ?? res.data;

let onSessionExpired = () => {};
export const setOnSessionExpired = (fn) => {
  onSessionExpired = fn; // authStore đăng ký: nhận ApiError để biết lý do (ví dụ ACCOUNT_BANNED)
};

// Gắn access token vào mọi request
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// [TẠM] BE trả 403 body rỗng khi thiếu/hết hạn token. Bỏ điều kiện 403 khi BE trả 401 [CHỜ BE]
function isTokenExpired(error) {
  const { status, data } = error.response ?? {};
  return status === 401 || (status === 403 && !data);
}

let refreshing = null;
async function refreshTokens() {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
  // Dùng axios gốc (không qua interceptor) để không lặp vô hạn
  const res = await axios.post(`${ENV.API_BASE_URL}/api/auth/refresh`, {
    refreshToken,
  });
  const data = unwrap(res);
  // Refresh token xoay vòng: luôn lưu đè cả hai
  await tokenStorage.save({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Lỗi khác, đã thử lại rồi, hoặc chính API auth → trả lỗi luôn
    if (
      !isTokenExpired(error) ||
      original?._retry ||
      original?.url?.includes("/api/auth/")
    ) {
      return Promise.reject(toApiError(error));
    }
    original._retry = true;
    try {
      // Nhiều request cùng hết hạn một lúc → chỉ refresh MỘT lần, các request còn lại chờ chung
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      await refreshing;
      return api(original); // gửi lại request cũ với token mới
    } catch (refreshError) {
      // Mất mạng lúc refresh: KHÔNG đăng xuất, chỉ báo lỗi mạng
      if (
        !refreshError?.response &&
        refreshError?.message !== "NO_REFRESH_TOKEN"
      ) {
        return Promise.reject(toApiError(refreshError));
      }
      // Refresh bị BE từ chối (hết hạn, ACCOUNT_BANNED [CHỜ BE]) hoặc không có refresh token → đăng xuất
      const reason = refreshError.response
        ? toApiError(refreshError)
        : toApiError(error);
      onSessionExpired(reason);
      return Promise.reject(reason);
    }
  },
);
