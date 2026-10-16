import { z } from "zod";
import { PASSWORD_REGEX, PHONE_REGEX } from "@/utils/validators";

// Email dùng chung cho các form auth: bỏ dấu cách thừa, bắt buộc, đúng định dạng
const emailField = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email")
  .pipe(z.email("Email không hợp lệ"));

// AU-02: chỉ kiểm có nhập + đúng định dạng email. KHÔNG kiểm độ mạnh mật khẩu khi đăng nhập
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

// AU-03: đăng ký Member
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
    email: emailField,
    // Cho phép gõ "0912 345 456" → bỏ dấu cách trước khi kiểm
    phone: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .pipe(
        z
          .string()
          .min(1, "Vui lòng nhập số điện thoại")
          .regex(
            PHONE_REGEX,
            "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0",
          ),
      ),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .regex(PASSWORD_REGEX, "Mật khẩu ít nhất 8 ký tự, có cả chữ và số"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
    agree: z
      .boolean()
      .refine((v) => v === true, "Bạn cần đồng ý với điều khoản để tiếp tục"),
  })
  // So 2 ô mật khẩu; lỗi gắn vào ô "Nhập lại mật khẩu"
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "Hai mật khẩu chưa khớp",
  });
// AU-07: đổi mật khẩu
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu mới")
      .regex(PASSWORD_REGEX, "Mật khẩu ít nhất 8 ký tự, có cả chữ và số"),
    newPasswordRepeat: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((d) => d.newPassword !== d.oldPassword, {
    path: ["newPassword"],
    error: "Mật khẩu mới phải khác mật khẩu hiện tại",
  })
  .refine((d) => d.newPassword === d.newPasswordRepeat, {
    path: ["newPasswordRepeat"],
    error: "Hai mật khẩu chưa khớp",
  });
// AU-05: quên mật khẩu — chỉ cần email
export const forgotPasswordSchema = z.object({
  email: emailField,
});
