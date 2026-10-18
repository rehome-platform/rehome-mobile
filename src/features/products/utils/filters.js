// Bỏ giá trị rỗng: {} và {categoryId: undefined} phải ra cùng một khoá cache; BE nhận "" là một giá trị
export const cleanFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== ""),
  );
