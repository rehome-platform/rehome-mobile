// Khoá cache react-query của nhóm ký gửi. invalidate ["consign","forms"] → làm mới mọi danh sách form
export const consignKeys = {
  forms: (status) => ["consign", "forms", status ?? "ALL"],
  pendingCount: () => ["consign", "forms", "PENDING_COUNT"],
  form: (id) => ["consign", "form", id],
  warehouses: (lat, lng) => ["consign", "warehouses", lat ?? null, lng ?? null],
};
