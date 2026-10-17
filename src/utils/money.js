// 1000000 → "1.000.000". Tự chèn dấu chấm (không phụ thuộc Intl của Hermes)
export const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return "";
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// 1000000 → "1.000.000 đ"
export const formatVnd = (value) => {
  const text = formatNumber(value);
  return text ? `${text} đ` : "";
};

// "1.000.000 đ" → 1000000. Không có chữ số nào → undefined (ô trống — zod báo "Nhập giá…")
export const parseVnd = (text) => {
  const digits = String(text ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
};
