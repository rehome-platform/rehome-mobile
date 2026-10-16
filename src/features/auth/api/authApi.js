// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./authApi.real";
import * as mock from "./authApi.mock";

const password = MOCK.password ? mock : real; // quên / đặt lại mật khẩu [CHỜ BE bản OTP]

export const authApi = {
  ...real, // đăng ký, OTP, đăng nhập, logout, getMe, đổi mật khẩu → API thật
  forgotPassword: password.forgotPassword,
  verifyResetOtp: password.verifyResetOtp,
  resetPassword: password.resetPassword,
};
