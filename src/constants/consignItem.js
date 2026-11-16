// Dữ liệu cho màn "Thêm món" ký gửi: nhóm danh mục, khung ảnh, size, tình trạng.
// BE chỉ có danh mục phẳng (Áo khoác, Quần jean…) → app tự gom nhóm theo tên để chọn nhanh

// Nhóm danh mục. Danh mục không khớp nhóm nào → "Khác".
// [CHỜ BE/Moderator] thêm danh mục Giày dép, Mũ nón, Túi xách, Phụ kiện → tự vào đúng nhóm
export const CATEGORY_GROUPS = [
  { key: "TOP", label: "Áo", icon: "shirt-outline", pattern: /^áo/i },
  { key: "BOTTOM", label: "Quần", icon: "man-outline", pattern: /^quần/i },
  {
    key: "DRESS",
    label: "Váy & Đầm",
    icon: "woman-outline",
    pattern: /^(váy|đầm|chân váy|jumpsuit)/i,
  },
  {
    key: "SHOES",
    label: "Giày dép",
    icon: "footsteps-outline",
    pattern: /^(giày|dép|sandal|boot)/i,
  },
  {
    key: "HAT",
    label: "Mũ nón",
    icon: "sunny-outline",
    pattern: /^(mũ|nón)/i,
  },

  { key: "OTHER", label: "Khác", icon: "pricetags-outline", pattern: null },
];

export const groupOfCategory = (name = "") =>
  CATEGORY_GROUPS.find((g) => g.pattern?.test(name.trim()))?.key ?? "OTHER";

// Khung ảnh theo nhóm. required = bắt buộc. Ảnh thêm (ngoài khung) tối đa đủ MAX_PHOTOS
const CLOTHES_SLOTS = [
  {
    key: "front",
    label: "Mặt trước",
    hint: "Trải phẳng, thấy cả món",
    required: true,
  },
  {
    key: "back",
    label: "Mặt sau",
    hint: "Lật mặt sau, thấy cả món",
    required: true,
  },
  {
    key: "tag",
    label: "Tem mác & size",
    hint: "Rõ chữ thương hiệu và size",
    required: true,
  },
  {
    key: "defect",
    label: "Chi tiết / lỗi",
    hint: "Vết bẩn, sờn, rách (nếu có)",
  },
];
const SHOES_SLOTS = [
  {
    key: "front",
    label: "Hai bên",
    hint: "Chụp cả đôi, nhìn ngang",
    required: true,
  },
  {
    key: "back",
    label: "Đế giày",
    hint: "Lật đế, thấy độ mòn",
    required: true,
  },
  {
    key: "tag",
    label: "Bên trong & size",
    hint: "Rõ size và tem trong lưỡi gà",
    required: true,
  },
  { key: "defect", label: "Chi tiết / lỗi", hint: "Bong keo, trầy (nếu có)" },
];
const HAT_SLOTS = [
  {
    key: "front",
    label: "Phía trước",
    hint: "Thấy rõ dáng mũ, logo",
    required: true,
  },
  {
    key: "back",
    label: "Bên trong",
    hint: "Lật mũ, thấy lót và vành trong",
    required: true,
  },
  {
    key: "tag",
    label: "Tem & size",
    hint: "Rõ chữ thương hiệu và size",
    required: true,
  },
  {
    key: "defect",
    label: "Chi tiết / lỗi",
    hint: "Bạc màu, sờn vành (nếu có)",
  },
];

export const photoSlotsOf = (group) =>
  group === "SHOES" ? SHOES_SLOTS : group === "HAT" ? HAT_SLOTS : CLOTHES_SLOTS;

// Size theo nhóm: giày → số; áo, quần, váy đầm, mũ, khác → chữ + Free size. "Khác" → ghi trong mô tả
const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free size"];
const SHOE_SIZES = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
];
export const sizeOptionsOf = (group) =>
  [...(group === "SHOES" ? SHOE_SIZES : LETTER_SIZES), "Khác"].map((s) => ({
    value: s,
    label: s,
  }));

export const CONDITION = {
  NEW_TAG: "NEW_TAG",
  LIKE_NEW: "LIKE_NEW",
  GOOD: "GOOD",
  FLAW: "FLAW",
};
export const CONDITION_OPTIONS = [
  { value: CONDITION.NEW_TAG, label: "Mới, còn tem" },
  { value: CONDITION.LIKE_NEW, label: "Như mới" },
  { value: CONDITION.GOOD, label: "Tốt, có dấu hiệu dùng" },
  { value: CONDITION.FLAW, label: "Có lỗi nhỏ" },
];
export const conditionLabel = (value) =>
  CONDITION_OPTIONS.find((c) => c.value === value)?.label ?? "";
