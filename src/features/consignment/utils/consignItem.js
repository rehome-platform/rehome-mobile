import {
  conditionLabel,
  groupOfCategory,
  photoSlotsOf,
} from "@/constants/consignItem";

// Size "Khác" = Member tự ghi trong mô tả → không gửi lên cột size
const sizeValue = (size) => (size && size !== "Khác" ? size : null);

// Ghi chú là TUỲ CHỌN với Member, nhưng BE bắt description không trống (DESCRIPTION_REQUIRED, cột NOT NULL)
// → để trống thì gửi mô tả tự ghép từ size + tình trạng ("Size M · Như mới")
const AUTO_FALLBACK = "Không có ghi chú thêm";
export const autoDescription = ({ size, condition }) =>
  [size ? `Size ${size}` : null, conditionLabel(condition) || null]
    .filter(Boolean)
    .join(" · ") || AUTO_FALLBACK;
export const descriptionOf = (note, item) =>
  note?.trim() || autoDescription(item);
// Mở lại form / nháp: mô tả do app tự ghép → ô ghi chú để trống, không hiện như người dùng đã gõ
const noteFrom = (description, item) => {
  const d = description?.trim() ?? "";
  return d === autoDescription(item) || d === AUTO_FALLBACK ? "" : d;
};

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
  description: descriptionOf(item.note, item), // BE bắt không trống → để trống ghi chú thì tự ghép size + tình trạng
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
    note: noteFrom(form.description, form),
  };
};

// ===== Nháp ký gửi trên server =====

// Một món → body POST / PUT /consignment-forms/drafts (chưa có kho; kho chọn lúc gửi)
export const toDraftPayload = (item, photoUrls) => {
  const { warehouseId, ...rest } = toCreatePayload(item, null, photoUrls);
  return rest;
};

// Sau khi upload: thay uri trong máy bằng url, giữ đúng khung (mặt trước, mặt sau…). urls cùng thứ tự orderedPhotos
export const withUploadedPhotos = (item, urls) => {
  const photos = { extra: [] };
  let i = 0;
  photoSlotsOf(item.group).forEach((s) => {
    if (item.photos?.[s.key]) photos[s.key] = urls[i++];
  });
  photos.extra = urls.slice(i);
  return { ...item, photos };
};

// Nháp trên server (chi tiết form, status DRAFT) → 1 món. Ảnh lần lượt vào các khung bắt buộc, còn lại là ảnh khác
export const draftToItem = (draft) => {
  const group = groupOfCategory(draft.categoryName);
  const urls = draft.photoUrls ?? [];
  const slots = photoSlotsOf(group).filter((s) => s.required);
  const photos = { extra: urls.slice(slots.length) };
  slots.forEach((s, i) => {
    if (urls[i]) photos[s.key] = urls[i];
  });
  return {
    key: `draft-${draft.id}`,
    draftId: draft.id,
    group,
    categoryId: draft.categoryId ?? "",
    categoryName: draft.categoryName ?? "",
    brandId: draft.brandId ?? "",
    brandName: draft.brandName ?? "",
    photos,
    productName: draft.productName ?? "",
    size: draft.size ?? "",
    condition: draft.condition ?? "",
    desiredPrice: draft.desiredPrice,
    note: noteFrom(draft.description, draft),
  };
};
