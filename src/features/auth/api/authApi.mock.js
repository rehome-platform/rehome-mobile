// CHỈ mock phần BE chưa dùng được: quên / đặt lại mật khẩu (BE đang gửi link web) [CHỜ BE]
// Cùng tên hàm + hình dạng dữ liệu với authApi.real.js
import { ApiError } from "@/lib/api/errors";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const OTP_INVALID = "Mã xác thực không hợp lệ, hết hạn hoặc đã sử dụng."; // giống message BE

export async function forgotPassword() {
  await delay(); // BE trả 204, không có dữ liệu
}

// OTP giả: 123456 đúng; mã khác → lỗi giống BE
export async function verifyResetOtp({ otp }) {
  await delay();
  if (otp !== "123456") {
    throw new ApiError({ status: 400, code: "HTTP_400", message: OTP_INVALID });
  }
  return { message: "OTP hợp lệ.", resetToken: "mock-reset-token" };
}

export async function resetPassword() {
  await delay();
  return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập." };
}
