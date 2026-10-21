import { api, unwrap } from "@/lib/api/client";
import { TRYON_LIMITS } from "@/constants/tryon";

// ===== Phase 6 [CHỜ BE] — theo API_CONTRACT, BE a0c6abe mới có entity, chưa có controller =====

// API 96 → [{id, name, currentPrice}]
export async function getSuggestions({ slot, excludeProductId }) {
  return unwrap(
    await api.get("/tryon/suggestions", { params: { slot, excludeProductId } }),
  );
}

// Tab "Tất cả" = API 49. [CHỜ BE câu 6] lọc theo slot — tạm gửi tryonSlot
export async function getSlotProducts({ slot, page = 0, size = 20 }) {
  return unwrap(
    await api.get("/products", { params: { tryonSlot: slot, page, size } }),
  );
}

// API 97 — chờ lâu: timeout riêng + huỷ được (signal). Không đổi timeout chung
export async function createTryonImage(payload, { signal } = {}) {
  return unwrap(
    await api.post("/tryon/images", payload, {
      timeout: TRYON_LIMITS.REQUEST_TIMEOUT_MS,
      signal,
    }),
  );
}

// API 98
export async function getTryonImages({ page = 0, size = 20 } = {}) {
  return unwrap(await api.get("/tryon/images", { params: { page, size } }));
}

// [CHỜ BE câu 4] chưa có trong contract
export async function getTryonImage(id) {
  return unwrap(await api.get(`/tryon/images/${id}`));
}

// API 99
export async function deleteTryonImage(id) {
  return unwrap(await api.delete(`/tryon/images/${id}`));
}
