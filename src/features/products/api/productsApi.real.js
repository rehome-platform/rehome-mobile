import { api, unwrap } from "@/lib/api/client";
import { cleanFilters } from "../utils/filters";
import { getTryonSlots } from "@/features/catalog/utils/tryonSlots";

// API 49 — chỉ món ON_SALE, mới lên sàn trước. page bắt đầu từ 0
// [CHỜ BE] Render 868d933 vẫn đòi đăng nhập (401 với Guest) — đã báo BE permitAll
export async function getProducts(params = {}) {
  return unwrap(await api.get("/products", { params: cleanFilters(params) }));
}

// API 50 — BE trả photos là mảng URL, ngày kiểm định tên inspectionDate
// → đổi về hình dạng màn hình đang dùng ({url}, inspectedAt), màn hình không phải sửa.
// tryonSlot (nút Thử đồ BR-04) BE không trả → tra theo categoryId; tra lỗi thì coi như không thử được
export async function getProduct(id) {
  const [p, slots] = await Promise.all([
    api.get(`/products/${id}`).then(unwrap),
    getTryonSlots().catch(() => ({})),
  ]);
  return {
    ...p,
    photos: (p.photos ?? []).map((url) => ({ url })),
    // Chi tiết BE chỉ có photos; các ô dùng chung với thẻ danh sách (thử đồ, giỏ…) đọc thumbnailUrl
    thumbnailUrl: p.thumbnailUrl ?? p.photos?.[0] ?? null,
    inspectedAt: p.inspectionDate ?? null,
    tryonSlot: slots[p.categoryId] ?? null,
  };
}

// Phí ship GHN thật từ kho của món tới địa chỉ nhận (BE ProductController). Phí chỉ phụ thuộc KHO + địa chỉ,
// không phụ thuộc số món → BR-08 hỏi theo 1 món đại diện mỗi kho (= mỗi đơn)
export async function getShippingFee(productId, { wardName, provinceName }) {
  const res = unwrap(
    await api.get(`/products/${productId}/shipping-fee-preview`, {
      params: { wardName, provinceName },
    }),
  );
  return Number(res.shippingFee);
}
