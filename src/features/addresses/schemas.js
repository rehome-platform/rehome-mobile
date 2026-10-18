import { z } from "zod";
import { PHONE_REGEX } from "@/utils/validators";

// BR-07. Mức min/max là [GIẢ ĐỊNH] (BE chỉ kiểm không trống)
export const addressSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "Nhập họ tên người nhận")
    .max(100, "Tối đa 100 ký tự"),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, "")) // cho gõ "0912 345 456"
    .pipe(
      z
        .string()
        .min(1, "Nhập số điện thoại người nhận")
        .regex(PHONE_REGEX, "Số điện thoại gồm 10 số, bắt đầu bằng 0"),
    ),
  addressDetail: z
    .string()
    .trim()
    .min(10, "Nhập địa chỉ đầy đủ: số nhà, đường, phường/xã, tỉnh/thành phố")
    .max(255, "Tối đa 255 ký tự"),
  isDefault: z.boolean(),
});
