// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as mock from "./organizationApi.mock";

// [CHỜ BE] chưa có bản thật (upload, đăng ký kèm mật khẩu, trạng thái hồ sơ).
// BE xong → tạo organizationApi.real.js cùng tên hàm, chọn theo MOCK.organization như authApi.js
if (!MOCK.organization)
  console.warn("organizationApi: chưa có bản thật, vẫn dùng mock");

export const organizationApi = mock;
