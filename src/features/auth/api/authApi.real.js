import { jwtDecode } from "jwt-decode";
import { api, unwrap } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { ROLES } from "@/constants/roles";
import { OTP_PURPOSE } from "@/constants/auth";

// ===== Đăng ký + OTP =====
// Member: POST /api/auth/register · Tổ chức: POST /api/organizations/register/account
// (BE 7572732 bỏ field role — /api/auth/register LUÔN tạo MEMBER). Cùng body, cùng trả {message},
// cùng gửi OTP REGISTER → xác thực bằng verify-otp như Member
export const register = async ({
  fullName,
  email,
  phone,
  password,
  role = ROLES.MEMBER,
}) =>
  unwrap(
    await api.post(
      role === ROLES.ORGANIZATION
        ? "/api/organizations/register/account"
        : "/api/auth/register",
      { fullName, email, phone, password },
    ),
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

// Quên mật khẩu (AU-05) — 2 cách, dùng chung "phiên đặt lại" (cách gửi sau cùng mới dùng được):
// Cách 1 — OTP: gửi mã qua resend-otp (FORGOT_PASSWORD) → verify-otp lấy resetToken → password/reset, làm hết TRONG APP.
// Luôn trả như nhau dù email có tồn tại hay không. Gửi lại < 60 giây → 429
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
// Cách 2 — LINK: POST /api/auth/password/forgot → email có link {APP_FRONTEND_URL}/reset-password?email=&token=
// → người dùng đặt mật khẩu mới trên TRANG WEB (trình duyệt điện thoại) rồi quay lại app đăng nhập.
// BE luôn trả 200 giống nhau (email không có / chưa xác thực / bị khoá / gửi lại < 60 giây → im lặng không gửi)
export const forgotPasswordByLink = async ({ email }) =>
  unwrap(await api.post("/api/auth/password/forgot", { email }));
