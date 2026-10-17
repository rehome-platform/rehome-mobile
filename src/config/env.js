// Phải viết đúng process.env.EXPO_PUBLIC_..., không destructure — Expo thay giá trị lúc build
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === "true",
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "", // Web client ID của BE (không phải secret)
};

// Nhóm API BE chưa có / chưa dùng được → mock. BE xong nhóm nào thì đổi nhóm đó sang false
export const MOCK = {
  password: false, // quên / đặt lại mật khẩu — gọi thật qua resend-otp + verify-otp + password/reset
  upload: true, // [CHỜ BE] POST /uploads
  organization: true, // [CHỜ BE] đăng ký có mật khẩu, trạng thái hồ sơ
  consignment: true, // [CHỜ BE] API 14–24, 44 — Phase 2
};
