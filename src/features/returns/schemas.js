import { z } from "zod";
import { RETURN_LIMITS, RETURN_REASONS } from "@/constants/returns";

// RT-01 (zod 4: message dạng { error }). Lý do + mô tả ghép thành một chuỗi reason khi gửi
export const returnSchema = z.object({
  reasonKey: z.enum(
    RETURN_REASONS.map((r) => r.key),
    { error: "Chọn lý do trả hàng" },
  ),
  detail: z
    .string()
    .trim()
    .min(10, "Mô tả cụ thể chỗ không đúng (ít nhất 10 ký tự)") // [GIẢ ĐỊNH]
    .max(500, "Tối đa 500 ký tự"),
  photos: z
    .array(z.string())
    .min(RETURN_LIMITS.MIN_PHOTOS, "Cần ít nhất 1 ảnh chứng minh")
    .max(RETURN_LIMITS.MAX_PHOTOS, `Tối đa ${RETURN_LIMITS.MAX_PHOTOS} ảnh`),
});
