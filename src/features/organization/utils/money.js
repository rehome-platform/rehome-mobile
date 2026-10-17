// 1000000 → "1.000.000 đ". Tự chèn dấu chấm (không phụ thuộc Intl của Hermes)
export const formatVnd = (value) => {
  if (value == null || Number.isNaN(value)) return "";
  const digits = Math.round(value).toString();
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
};

// "1.000.000 đ" → 1000000. Không có chữ số nào → undefined (ô trống — zod báo "Nhập giá…")
export const parseVnd = (text) => {
  const digits = String(text ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
};
