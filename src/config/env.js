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
  organization: true, // [TẠM] API thật có từ BE 2af9d85 nhưng Render chưa deploy (bản cũ tạo nhầm account mới) → đổi false khi BE deploy
  consignment: true, // [CHỜ BE] API 14–24, 44 — Phase 2
  // Phase 3 — mua hàng
  products: true, // [TẠM] GET /products đã có, nhưng id danh mục/thương hiệu còn mock (API 44 chưa có) → lọc gửi id giả lên BE sẽ lỗi; sàn thật cũng chưa có hàng. Đổi false khi BE có API 44 + có hàng
  productDetail: true, // [CHỜ BE] API 50 GET /products/{id}
  cart: true, // [TẠM] đi CÙNG MOCK.products: id món mock (sp-001…) gửi lên BE sẽ 404. BE có sản phẩm mẫu → đổi cả hai sang false
  orders: true, // [TẠM] đi cùng products/cart (sản phẩm, giỏ đang mock). POST /orders thật đã có (ordersApi.real.js)
  payment: true, // [CHỜ BE] API 60 thanh toán, 61 webhook MoMo, 63 xem đơn
  orderList: true, // [CHỜ BE] API 62–67: danh sách, chi tiết, theo dõi, huỷ, xác nhận, đánh giá đơn
  wallet: true, // [CHỜ BE] API 73–78: ví, lịch sử giao dịch, doanh thu, rút tiền
  returns: true, // [CHỜ BE] API 79–82: trả hàng (Phase 5)
};
