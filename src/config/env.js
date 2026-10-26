// Phải viết đúng process.env.EXPO_PUBLIC_..., không destructure — Expo thay giá trị lúc build
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === "true",
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "", // Web client ID của BE (không phải secret)
};

// Nhóm API BE chưa có / chưa dùng được → mock. BE xong nhóm nào thì đổi nhóm đó sang false
export const MOCK = {
  password: false, // quên mật khẩu: OTP (resend-otp + verify-otp + password/reset) hoặc link (password/forgot)
  upload: false, // POST /uploads thật (BE 7572732) — multipart + ?folder=
  organization: false, // Đăng ký / nộp lại hồ sơ tổ chức thật (BE 7572732). [CHỜ BE] GET /api/organizations/me
  consignment: true, // [CHỜ BE] API 14–24, 44 — Phase 2
  catalog: false, // API 44 GET /categories, /brands — đã có (BE 868d933). id thật là UUID → đi cùng MOCK.products = false
  // Phase 3 — mua hàng
  products: false, // API 49 thật (BE 868d933). [CHỜ BE] Guest bị 401 — tạm test khi đã đăng nhập
  productDetail: false, // API 50 GET /products/{id} — đã có (BE 868d933)
  cart: false, // API 51–53 thật — đi CÙNG MOCK.products (id món phải là id thật)
  orders: false, // API 59 POST /orders thật (BE 868d933)
  payment: false, // Ví (POST /orders/pay) + MoMo/VNPay sandbox thật (BE 868d933)
  orderList: false, // API 62–67 thật: danh sách, chi tiết, theo dõi, huỷ, xác nhận, đánh giá (BE 868d933)
  wallet: false, // API 73–78 + /wallet/config thật (BE 868d933)
  returns: true, // [CHỜ BE] API 79–82: trả hàng (Phase 5)
  withdrawals: true, // [CHỜ BE] API 90–92 rút lại hàng + 94–95 hàng xuống cấp (Phase 5)
  tryon: true, // [CHỜ BE] API 96–99: thử đồ AI (Phase 6)
  community: true, // [CHỜ BE] API 100–109: tổ chức, chiến dịch, bài viết, bình luận, theo dõi, báo cáo (Phase 6)
  chat: true, // [CHỜ BE] API 110–113: hội thoại, tin nhắn (Phase 6)
  notifications: true, // [CHỜ BE] API 114–116: thông báo trong app (Phase 6)
};
