import { api, unwrap } from "@/lib/api/client";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { TRYON_LIMITS } from "@/constants/tryon";

// Thử đồ AI thật (API 96–99 + GET /tryon/images/{id}). Cùng hình dạng dữ liệu với tryonApi.mock.js.
// - /products?tryonSlot= lọc món đang bán theo loại thử đồ
// - món trong ảnh có warehouseId → AI-04 báo "tách n đơn" khi mua cả bộ
// - [CHỜ BE] API 96 gợi ý chỉ trả { id, name, currentPrice } → món nào thiếu thumbnailUrl thì lấy thêm chi tiết
//   (ảnh, hãng, size). BE trả đủ trường như ProductSummaryResponse là tự bỏ bước gọi thêm, không phải sửa

const SUGGESTION_COUNT = 6;

// Món ở danh sách sàn (API 49 chỉ trả món đang bán) → gắn loại thử đồ + trạng thái cho phòng thử đồ
const toSlotItem = (slot) => (p) => ({
  ...p,
  tryonSlot: slot,
  status: p.status ?? PRODUCT_STATUS.ON_SALE,
});

// AI-02 tab Tất cả — GET /products?tryonSlot=, mới lên sàn trước
export async function getSlotProducts({ slot, page = 0, size = 20 }) {
  const p = unwrap(
    await api.get("/products", { params: { tryonSlot: slot, page, size } }),
  );
  return { ...p, content: (p.content ?? []).map(toSlotItem(slot)) };
}

// Chi tiết món → dạng thẻ danh sách (ProductCard đọc thumbnailUrl, brandName, size, condition, giá)
const detailToCard = (d) => ({
  id: d.id,
  name: d.name,
  thumbnailUrl: d.photos?.[0] ?? null,
  brandName: d.brandName,
  categoryName: d.categoryName,
  size: d.size,
  condition: d.condition,
  originalPrice: d.originalPrice,
  currentPrice: d.currentPrice,
  status: d.status,
  warehouseId: d.warehouseId,
});

// AI-02 tab Gợi ý — API 96 GET /tryon/suggestions?slot&excludeProductId.
// Món nào không lấy được chi tiết thì vẫn hiện tên + giá; món vừa hết bán thì bỏ
export async function getSuggestions({ slot, excludeProductId }) {
  const list =
    unwrap(
      await api.get("/tryon/suggestions", {
        params: { slot, excludeProductId },
      }),
    ) ?? [];
  const top = list.slice(0, SUGGESTION_COUNT);
  // BE đã trả đủ trường thẻ (thumbnailUrl…) → dùng luôn; chưa có thì mới gọi /products/{id} cho món đó
  const details = await Promise.allSettled(
    top.map((s) =>
      s.thumbnailUrl
        ? Promise.resolve(null)
        : api.get(`/products/${s.id}`).then(unwrap),
    ),
  );
  return top
    .map((s, i) =>
      s.thumbnailUrl
        ? { ...s, status: s.status ?? PRODUCT_STATUS.ON_SALE }
        : details[i].status === "fulfilled"
          ? detailToCard(details[i].value)
          : { ...s, thumbnailUrl: null, status: PRODUCT_STATUS.ON_SALE },
    )
    .filter((p) => p.status === PRODUCT_STATUS.ON_SALE)
    .map(toSlotItem(slot));
}

// BE: top / bottom / dress (null nếu không có) → items theo thứ tự hiển thị + id từng ô như mock
const toImage = (img) => ({
  id: img.id,
  modelType: img.modelType,
  imageUrl: img.imageUrl,
  createdAt: img.createdAt,
  topProductId: img.top?.id ?? null,
  bottomProductId: img.bottom?.id ?? null,
  dressProductId: img.dress?.id ?? null,
  items: [img.dress, img.top, img.bottom].filter(Boolean),
});

// API 97 — BE chờ AI xong mới trả (vài chục giây): timeout riêng + huỷ được (signal). Không đổi timeout chung
export async function createTryonImage(payload, { signal } = {}) {
  const res = await api.post("/tryon/images", payload, {
    timeout: TRYON_LIMITS.REQUEST_TIMEOUT_MS,
    signal,
  });
  return toImage(unwrap(res));
}

// API 98 — mới nhất trước
export async function getTryonImages({ page = 0, size = 20 } = {}) {
  const p = unwrap(await api.get("/tryon/images", { params: { page, size } }));
  return { ...p, content: (p.content ?? []).map(toImage) };
}

// GET /tryon/images/{id}
export async function getTryonImage(id) {
  return toImage(unwrap(await api.get(`/tryon/images/${id}`)));
}

// API 99
export async function deleteTryonImage(id) {
  return unwrap(await api.delete(`/tryon/images/${id}`));
}
