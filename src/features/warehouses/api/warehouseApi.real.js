import { api, unwrap } from "@/lib/api/client";

// GET /warehouses — công khai, mọi kho đang hoạt động { id, name, address, openingHours, … }.
// Tổ chức chỉ gọi được API này (/warehouses/nearest chỉ cho MEMBER) → không có distanceKm
export async function getWarehouses() {
  const list = unwrap(await api.get("/warehouses"));
  return list.map((w) => ({ ...w, distanceKm: null }));
}
