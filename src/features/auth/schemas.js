import { z } from "zod";

// AU-02: chỉ kiểm có nhập + đúng định dạng email. KHÔNG kiểm độ mạnh mật khẩu khi đăng nhập
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .pipe(z.email("Email không hợp lệ")),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
