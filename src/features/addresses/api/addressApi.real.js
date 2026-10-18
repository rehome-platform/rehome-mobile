import { api, unwrap } from "@/lib/api/client";

// API 54–57 (đọc code BE 19/10). POST trả {id, recipientName, isDefault}, PUT trả {id, phone}
// → thiếu trường, màn hình luôn tải lại danh sách sau khi lưu.
// isDefault: true → BE tự bỏ mặc định ở địa chỉ khác. BE KHÔNG giới hạn 5 / chặn xoá mặc định → app tự chặn
export async function getAddresses() {
  return unwrap(await api.get("/addresses"));
}

export async function createAddress(payload) {
  return unwrap(await api.post("/addresses", payload));
}

export async function updateAddress(id, payload) {
  return unwrap(await api.put(`/addresses/${id}`, payload));
}

export async function deleteAddress(id) {
  return unwrap(await api.delete(`/addresses/${id}`));
}
