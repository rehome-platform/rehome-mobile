import { z } from "zod";
import { CONSIGN_LIMITS } from "@/constants/consignment";

// KG-02 / KG-05 (zod 4: message dạng { error }). Kích cỡ, tình trạng ghi trong mô tả (form không có cột riêng)
export const consignFormSchema = z.object({
  photos: z
    .array(z.string())
    .min(CONSIGN_LIMITS.MIN_PHOTOS, "Cần ít nhất 1 ảnh sản phẩm")
    .max(CONSIGN_LIMITS.MAX_PHOTOS, `Tối đa ${CONSIGN_LIMITS.MAX_PHOTOS} ảnh`),
  productName: z
    .string()
    .trim()
    .min(2, "Chưa nhập tên sản phẩm")
    .max(100, "Tối đa 100 ký tự"),
  categoryId: z.string({ error: "Chọn danh mục" }).min(1, "Chọn danh mục"),
  brandId: z.string({ error: "Chọn thương hiệu" }).min(1, "Chọn thương hiệu"),
  desiredPrice: z
    .number({ error: "Nhập giá mong muốn" })
    .int()
    .positive("Giá phải lớn hơn 0"),
  description: z
    .string()
    .trim()
    .min(10, "Ghi ngắn size và tình trạng (ít nhất 10 ký tự)")
    .max(1000, "Tối đa 1000 ký tự"),
  warehouseId: z.string().optional(), // chọn ở bước 2 — kiểm riêng khi bấm Gửi
});

// Các trường của bước 1 → dùng cho trigger() khi bấm "Tiếp tục — chọn kho"
export const STEP1_FIELDS = [
  "photos",
  "productName",
  "categoryId",
  "brandId",
  "desiredPrice",
  "description",
];
// Form từ API 17 → giá trị cho useForm. Dùng cho Sửa form (giữ kho) và Tạo lại từ form cũ (chọn kho lại)
export const formToValues = (form, { keepWarehouse = false } = {}) => ({
  photos: form.photoUrls ?? [],
  productName: form.productName ?? "",
  categoryId: form.categoryId ?? "",
  brandId: form.brandId ?? "",
  desiredPrice: form.desiredPrice,
  description: form.description ?? "",
  warehouseId: keepWarehouse ? (form.warehouse?.id ?? "") : "",
});
