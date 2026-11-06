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
  organization: false, // Đăng ký / nộp lại hồ sơ tổ chức + GET/PATCH /api/organizations/me thật
  consignment: false, // API 14–24 thật + biên nhận, số liệu kỳ, nháp (BE 41f10c8)
  catalog: false, // API 44 GET /categories, /brands — đã có (BE 868d933). id thật là UUID → đi cùng MOCK.products = false
  // Phase 3 — mua hàng
  products: false, // API 49 thật, Guest xem được (BE 41f10c8)
  productDetail: false, // API 50 GET /products/{id} — đã có (BE 868d933)
  cart: false, // API 51–53 thật — đi CÙNG MOCK.products (id món phải là id thật)
  orders: false, // API 59 POST /orders thật (BE 868d933)
  payment: false, // Ví (POST /orders/pay) + MoMo/VNPay sandbox thật (BE 868d933)
  orderList: false, // API 62–67 thật: danh sách, chi tiết, theo dõi, huỷ, xác nhận, đánh giá (BE 868d933)
  wallet: false, // API 73–78 + /wallet/config thật (BE 868d933)
  returns: false, // BE 51c2027: ReturnRequestController (Phase 5)
  withdrawals: false, // API 90–95 thật: rút lại hàng + hàng xuống cấp (BE 65d8475). Phí: WALLET | MOMO | VNPAY
  tryon: false, // API 96–99 thật: gợi ý, lọc /products?tryonSlot, GET /tryon/images/{id}
  community: false, // API 100–109 thật (BE edff4ae): tổ chức, chiến dịch, bảng tin, thích, bình luận, theo dõi, báo cáo
  chat: false, // API 110–113 thật, cả Member và Tổ chức: tin cuối, isMine, GET /conversations/{id}
  notifications: false, // API 114–116 thật: tiêu đề, đích mở màn, đánh dấu đã đọc, số chưa đọc
  orgCampaigns: false, // App tổ chức: chiến dịch, lượt chờ lấy, note quyên góp — thật (BE 41f10c8)
  orgPosts: false, // App tổ chức: bài viết, bình luận, thả tim + trả lời (L9) — thật (BE 41f10c8)
};
