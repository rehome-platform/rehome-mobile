import { formatNumber, formatVnd } from "@/utils/money";

// Bỏ giá trị rỗng: {} và {categoryId: undefined} phải ra cùng một khoá cache; BE nhận "" là một giá trị
export const cleanFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== ""),
  );

// Số bộ lọc đang bật (nút "Lọc · k"). Khoảng giá tính là 1
export const countFilters = (f = {}) =>
  [f.categoryId, f.brandId, f.priceMin ?? f.priceMax].filter(
    (v) => v != null && v !== "",
  ).length;

// "100.000 – 500.000 đ" / "Từ 100.000 đ" / "Đến 500.000 đ"
export const priceLabel = (min, max) => {
  if (min != null && max != null)
    return `${formatNumber(min)} – ${formatVnd(max)}`;
  if (min != null) return `Từ ${formatVnd(min)}`;
  if (max != null) return `Đến ${formatVnd(max)}`;
  return null;
};
