import { groupOfCategory, photoSlotsOf } from "@/constants/consignItem";

// Size "Khác" = Member tự ghi trong mô tả → không gửi lên cột size
const sizeValue = (size) => (size && size !== "Khác" ? size : null);

// Tên gợi ý từ danh mục + thương hiệu: "Áo khoác Uniqlo" (bỏ thương hiệu kiểu "Khác / không rõ")
export const suggestName = ({ categoryName, brandName }) =>
  [categoryName, /khác|không rõ/i.test(brandName ?? "") ? null : brandName]
    .filter(Boolean)
    .join(" ");

// Ảnh theo khung → mảng uri đúng thứ tự (ảnh đầu = ảnh đại diện), bỏ ô trống
export const orderedPhotos = (item) => [
  ...photoSlotsOf(item.group)
    .map((s) => item.photos?.[s.key])
    .filter(Boolean),
  ...(item.photos?.extra ?? []),
];

// Ô bắt buộc còn thiếu → nhãn để báo lỗi ("Mặt sau, Tem mác & size")
export const missingSlots = (item) =>
  photoSlotsOf(item.group)
    .filter((s) => s.required && !item.photos?.[s.key])
    .map((s) => s.label);

// Một món trong app → body POST /consignment-forms (photoUrls truyền vào sau khi upload).
// Size, tình trạng là cột riêng (BE d10db3c); mô tả chỉ còn ghi chú của Member
export const toCreatePayload = (item, warehouseId, photoUrls) => ({
  categoryId: item.categoryId,
  brandId: item.brandId,
  productName: item.productName.trim(),
  description: item.note?.trim() ?? "", // cột description NOT NULL ở BE → không gửi null
  desiredPrice: item.desiredPrice,
  size: sizeValue(item.size),
  condition: item.condition || null,
  warehouseId,
  photoUrls,
});
// Yêu cầu cũ (API 17, bị từ chối / hết hạn) → 1 món để ký gửi lại.
// Ảnh cũ là URL đã upload: 3 ảnh đầu điền vào 3 khung bắt buộc, còn lại vào "ảnh khác".
// Yêu cầu cũ chưa có size / tình trạng (tạo trước khi BE có cột) → để trống, người dùng chọn lại
export const formToItem = (form) => {
  const urls = form.photoUrls ?? [];
  return {
    key: `item-${Date.now()}`,
    group: groupOfCategory(form.categoryName),
    categoryId: form.categoryId ?? "",
    categoryName: form.categoryName ?? "",
    brandId: form.brandId ?? "",
    brandName: form.brandName ?? "",
    photos: {
      front: urls[0],
      back: urls[1],
      tag: urls[2],
      extra: urls.slice(3),
    },
    productName: form.productName ?? "",
    size: form.size ?? "",
    condition: form.condition ?? "",
    desiredPrice: form.desiredPrice,
    note: form.description ?? "",
  };
};
