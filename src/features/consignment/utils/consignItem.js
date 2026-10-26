import {
  conditionLabel,
  groupOfCategory,
  photoSlotsOf,
} from "@/constants/consignItem";

// BE chưa có cột size / tình trạng → ghép vào ĐẦU mô tả: "Size M · Như mới. <ghi chú>" [CHỜ BE cột riêng]
export const composeDescription = ({ size, condition, note }) =>
  [
    [size && size !== "Khác" ? `Size ${size}` : null, conditionLabel(condition)]
      .filter(Boolean)
      .join(" · "),
    note?.trim(),
  ]
    .filter(Boolean)
    .join(". ");

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

// Một món trong app → body POST /consignment-forms (photoUrls truyền vào sau khi upload)
export const toCreatePayload = (item, warehouseId, photoUrls) => ({
  categoryId: item.categoryId,
  brandId: item.brandId,
  productName: item.productName.trim(),
  description: composeDescription(item),
  desiredPrice: item.desiredPrice,
  warehouseId,
  photoUrls,
});
// Yêu cầu cũ (API 17, bị từ chối / hết hạn) → 1 món để ký gửi lại.
// Ảnh cũ là URL đã upload: 3 ảnh đầu điền vào 3 khung bắt buộc, còn lại vào "ảnh khác".
// Size / tình trạng yêu cầu cũ chưa có → để trống, người dùng chọn lại ở màn sửa món
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
    size: "",
    condition: "",
    desiredPrice: form.desiredPrice,
    note: form.description ?? "",
  };
};
