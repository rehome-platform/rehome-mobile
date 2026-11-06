import { api, unwrap } from "@/lib/api/client";
import { cleanFilters } from "../utils/filters";

// API 49 — chỉ món ON_SALE, mới lên sàn trước. page bắt đầu từ 0
// Guest gọi được (BE permitAll — đã gọi thử không kèm token)
export async function getProducts(params = {}) {
  return unwrap(await api.get("/products", { params: cleanFilters(params) }));
}

// API 50 — BE trả photos là mảng URL, ngày kiểm định tên inspectionDate
// → đổi về hình dạng màn hình đang dùng ({url}, inspectedAt), màn hình không phải sửa.
// tryonSlot (nút Thử đồ BR-04) BE trả sẵn theo danh mục (null = không thử được)
export async function getProduct(id) {
  const p = unwrap(await api.get(`/products/${id}`));
  return {
    ...p,
    photos: (p.photos ?? []).map((url) => ({ url })),
    // Chi tiết BE chỉ có photos; các ô dùng chung với thẻ danh sách (thử đồ, giỏ…) đọc thumbnailUrl
    thumbnailUrl: p.thumbnailUrl ?? p.photos?.[0] ?? null,
    inspectedAt: p.inspectionDate ?? null,
    tryonSlot: p.tryonSlot ?? null,
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
