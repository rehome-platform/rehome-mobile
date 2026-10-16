// Phải viết đúng process.env.EXPO_PUBLIC_..., không destructure — Expo thay giá trị lúc build
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === "true",
};

// Bật/tắt mock theo từng nhóm API: backend xong nhóm nào thì đổi nhóm đó sang ENV.USE_MOCK
export const MOCK = {
  password: true, // quên / đặt lại / đổi mật khẩu — [CHỜ BE]
  upload: true, // [CHỜ BE] POST /uploads
  organization: true, // [CHỜ BE] đăng ký có mật khẩu, trạng thái hồ sơ
};
