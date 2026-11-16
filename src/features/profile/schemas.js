import { z } from "zod";
import { PHONE_REGEX } from "@/utils/validators";

// PR-03: sửa hồ sơ Member
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, "")) // cho gõ "0912 345 456"
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập số điện thoại")
        .regex(PHONE_REGEX, "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0"),
    ),
});
