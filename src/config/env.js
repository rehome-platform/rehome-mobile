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
  consignment: false, // API 14–24 thật (BE d10db3c). [CHỜ BE mục 7, 22, 23] biên nhận + số liệu kỳ
  catalog: false, // API 44 GET /categories, /brands — đã có (BE 868d933). id thật là UUID → đi cùng MOCK.products = false
  // Phase 3 — mua hàng
  products: false, // API 49 thật (BE 868d933). [CHỜ BE] Guest bị 401 — tạm test khi đã đăng nhập
  productDetail: false, // API 50 GET /products/{id} — đã có (BE 868d933)
  cart: false, // API 51–53 thật — đi CÙNG MOCK.products (id món phải là id thật)
  orders: false, // API 59 POST /orders thật (BE 868d933)
  payment: false, // Ví (POST /orders/pay) + MoMo/VNPay sandbox thật (BE 868d933)
  orderList: false, // API 62–67 thật: danh sách, chi tiết, theo dõi, huỷ, xác nhận, đánh giá (BE 868d933)
  wallet: false, // API 73–78 + /wallet/config thật (BE 868d933)
  returns: false, // BE 51c2027: ReturnRequestController (Phase 5)
  withdrawals: false, // API 90–95 thật: rút lại hàng + hàng xuống cấp (BE 65d8475). Phí: WALLET | MOMO | VNPAY
  tryon: true, // [CHỜ BE] API 96–99: thử đồ AI (Phase 6)
  community: true, // [CHỜ BE] API 100–109: response BE còn thiếu logo, ảnh, ngày, tác giả… + thiếu API danh sách (đã báo 03/11)
  chat: false, // API 110–113 thật (BE 2c9533b), cả Member và Tổ chức. Nhắn tổ chức mới từ trang tổ chức chờ community thật
  notifications: false, // API 114 thật (BE 2c9533b). [CHỜ BE] tiêu đề, đích mở màn, đánh dấu đã đọc, số chưa đọc
  orgCampaigns: false, // App tổ chức: chiến dịch, lượt chờ lấy, note quyên góp — thật (BE 2c9533b). [CHỜ BE] preferredItemTypes, createdAt
  orgPosts: true, // [CHỜ BE] App tổ chức: bài viết + bình luận — response BE chưa có ảnh, ngày, người viết; tổ chức chưa thích / bình luận được (L9)
};
