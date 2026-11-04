// Tìm trên máy, không phân biệt hoa thường và dấu: "mai am" tìm ra "Mái ấm", "dam" ra "Đầm"
export const normalizeText = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

// Có chứa từ khoá ở MỘT trong các trường không. Từ khoá rỗng → luôn khớp
export const matchesSearch = (keyword, ...fields) => {
  const q = normalizeText(keyword);
  if (!q) return true;
  return fields.some((f) => normalizeText(f).includes(q));
};
