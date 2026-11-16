import { api, unwrap } from "@/lib/api/client";

// API 54–57. POST/PUT bắt buộc wardName + provinceName (BE 868d933 so với danh mục GHN, sai tên → 400)
// → app cho CHỌN từ danh sách GHN, không gõ tay. Response có thêm wardCode, provinceId
// isDefault: true → BE tự bỏ mặc định ở địa chỉ khác. BE chặn quá 5 địa chỉ (MAX_ADDRESSES_REACHED)

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
// Danh mục GHN hệ 2 cấp (sau sáp nhập 01/07/2025). Trả [{code, name}]; code tỉnh = provinceId
export async function getProvinces() {
  return unwrap(await api.get("/address-units/provinces"));
}

export async function getWards(provinceId) {
  return unwrap(
    await api.get("/address-units/wards", { params: { provinceId } }),
  );
}
