import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { TRYON_LIMITS } from "@/constants/tryon";
import { categoryIdsOfSlot } from "@/features/catalog/utils/tryonSlots";

// Thử đồ AI thật (API 97–99, BE 2c9533b). Cùng hình dạng dữ liệu với tryonApi.mock.js. Chỗ BE chưa có (đã báo):
// - API 96 gợi ý món → lấy món đang bán cùng loại (trang đầu)
// - /products chưa lọc theo loại thử đồ → lấy các danh mục của loại đó, gọi /products?categoryId= cho từng danh mục
// - chưa có GET /tryon/images/{id} → tìm trong bộ sưu tập
// - món trong ảnh chưa có warehouseId → AI-04 không báo được "tách n đơn"

const SUGGESTION_COUNT = 6;

// Món ở danh sách sàn (API 49 chỉ trả món đang bán) → gắn loại thử đồ + trạng thái cho phòng thử đồ
const toSlotItem = (slot) => (p) => ({
  ...p,
  tryonSlot: slot,
  status: PRODUCT_STATUS.ON_SALE,
});

// Món đang bán của một loại, phân trang. Nhiều danh mục cùng loại (vd. Áo, Áo khoác) → mỗi trang gọi trang đó
// của từng danh mục rồi gộp, mới lên sàn trước
async function slotPage(slot, page, size) {
  const ids = await categoryIdsOfSlot(slot);
  if (!ids.length)
    return { content: [], page, size, totalElements: 0, totalPages: 0 };
  const pages = await Promise.all(
    ids.map((categoryId) =>
      api.get("/products", { params: { categoryId, page, size } }).then(unwrap),
    ),
  );
  return {
    content: pages.flatMap((p) => p.content ?? []).map(toSlotItem(slot)),
    page,
    size,
    totalElements: pages.reduce((s, p) => s + (p.totalElements ?? 0), 0),
    totalPages: Math.max(0, ...pages.map((p) => p.totalPages ?? 0)),
  };
}

// AI-02 tab Gợi ý — [CHỜ BE API 96] tạm lấy món đang bán cùng loại
export async function getSuggestions({ slot, excludeProductId }) {
  const { content } = await slotPage(slot, 0, SUGGESTION_COUNT + 1);
  return content
    .filter((p) => p.id !== excludeProductId)
    .slice(0, SUGGESTION_COUNT);
}

// AI-02 tab Tất cả
export async function getSlotProducts({ slot, page = 0, size = 20 }) {
  return slotPage(slot, page, size);
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

// [CHỜ BE] chưa có GET /tryon/images/{id} → tìm trong bộ sưu tập (BE tối đa 50 / trang)
export async function getTryonImage(id) {
  for (let page = 0; ; page += 1) {
    const p = await getTryonImages({ page, size: 50 });
    const img = p.content.find((x) => x.id === id);
    if (img) return img;
    if (page + 1 >= (p.totalPages ?? 0))
      throw new ApiError({
        status: 404,
        code: "HTTP_404",
        message: "Không tìm thấy ảnh thử đồ.",
      });
  }
}

// API 99
export async function deleteTryonImage(id) {
  return unwrap(await api.delete(`/tryon/images/${id}`));
}
