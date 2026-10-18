import { jwtDecode } from "jwt-decode";
import { api, unwrap } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { ROLES } from "@/constants/roles";
import { OTP_PURPOSE } from "@/constants/auth";

// ===== Đăng ký + OTP =====
// role: "MEMBER" | "ORGANIZATION" — BE bắt buộc từ 2af9d85 (thiếu → lỗi 500). Mặc định Member
export const register = async ({
  fullName,
  email,
  phone,
  password,
  role = ROLES.MEMBER,
}) =>
  unwrap(
    await api.post("/api/auth/register", {
      fullName,
      email,
      phone,
      password,
      role,
    }),
  ); // { message }

export const verifyRegisterOtp = async ({ email, otp }) =>
  unwrap(
    await api.post("/api/auth/verify-otp", {
      email,
      otp,
      purpose: OTP_PURPOSE.REGISTER,
    }),
  ); // { message }, không trả token

export const resendOtp = async ({ email, purpose }) =>
  unwrap(await api.post("/api/auth/resend-otp", { email, purpose })); // { message }; gửi lại < 60 giây → 429

// ===== Đăng nhập / phiên =====
export const login = async ({ email, password }) =>
  unwrap(await api.post("/api/auth/login", { email, password })); // { accessToken, refreshToken, tokenType } — KHÔNG có user

// Google: gửi idToken lấy từ Google Sign-In → token như login. Email mới → BE tự tạo Member
export const loginWithGoogle = async ({ idToken }) =>
  unwrap(await api.post("/api/auth/google", { idToken })); // { accessToken, refreshToken, tokenType }

export const logout = async () => {
  await api.post("/api/auth/logout"); // cần header Authorization; token hết hạn → BE trả 500, nơi gọi bỏ qua lỗi
};

// [TẠM] đọc role từ claim "roles" ("ROLE_MEMBER"); bỏ khi login trả account.role [CHỜ BE]
export function roleFromToken(accessToken) {
  if (!accessToken) return null;
  const { roles = "" } = jwtDecode(accessToken);
  return roles.split(",")[0]?.replace("ROLE_", "") || null;
}

// BE chưa có /me chung → tự ghép user từ JWT + /members/me
export async function getMe() {
  const token = await tokenStorage.getAccessToken();
  const role = roleFromToken(token);
  // Tổ chức: chưa có GET /api/organizations/me [CHỜ BE] → tạm lấy email từ JWT (sub)
  if (role !== ROLES.MEMBER)
    return { role, email: token ? jwtDecode(token).sub : null };
  const profile = unwrap(await api.get("/members/me")); // không có tiền tố /api
  return { role, ...profile };
}

// ===== Mật khẩu =====
// Đổi mật khẩu (AU-07) — BE đã có (F008). Thành công trả CHUỖI "Đổi mật khẩu thành công".
// Lưu ý: nằm dưới /api/auth nên client.js KHÔNG tự refresh; token hết hạn → BE trả 500 [CHỜ BE]
export const changePassword = async ({
  oldPassword,
  newPassword,
  newPasswordRepeat,
}) =>
  unwrap(
    await api.post("/api/auth/password/change", {
      oldPassword,
      newPassword,
      newPasswordRepeat,
    }),
  );

// Quên mật khẩu (AU-05) — gửi OTP "đặt lại mật khẩu" qua resend-otp (purpose FORGOT_PASSWORD).
// KHÔNG dùng /api/auth/password/forgot vì API đó gửi LINK web (localhost), điện thoại không mở được.
// Luôn trả như nhau dù email có tồn tại hay không. Gửi lại < 60 giây → 429. [Báo BE xác nhận cách dùng này]
export const forgotPassword = ({ email }) =>
  resendOtp({ email, purpose: OTP_PURPOSE.FORGOT_PASSWORD });

export const verifyResetOtp = async ({ email, otp }) =>
  unwrap(
    await api.post("/api/auth/verify-otp", {
      email,
      otp,
      purpose: OTP_PURPOSE.FORGOT_PASSWORD,
    }),
  ); // { message, resetToken }

export const resetPassword = async ({
  email,
  resetToken,
  newPassword,
  confirmPassword,
}) =>
  unwrap(
    await api.post("/api/auth/password/reset", {
      email,
      resetToken,
      newPassword,
      confirmPassword,
    }),
  ); // { message }
