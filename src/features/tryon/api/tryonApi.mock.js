// Mock thử đồ AI (API 96–99) "sống" trong RAM, dùng sản phẩm mock Phase 3 (productsApi.mock).
// Field theo entity TryOnImage của BE (a0c6abe) + field mobile xin thêm [CHỜ BE PHASE6_GUIDE câu 4]:
// items (món trong ảnh, trạng thái hiện tại). Không lỗi ngẫu nhiên — chỉ lỗi khi bấm Khung Mock. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { MODEL_TYPE as M } from "@/constants/tryon";
import {
  mockOnSaleBySlot,
  mockProductSummary,
} from "@/features/products/api/productsApi.mock";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const fakeImage = (seed) => `https://picsum.photos/seed/tryon-${seed}/600/800`; // ảnh giả thay ảnh AI

const NO_SUGGESTION_ID = "sp-004"; // "Áo len cổ lọ" → AI-02 không có gợi ý
let failNext = false;
let seq = 0;

const aborted = () =>
  new ApiError({ status: 0, code: "ABORTED", message: "Đã huỷ tạo ảnh." });

// Chờ như model AI thật; huỷ (signal) thì dừng ngay
const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener?.("abort", () => {
      clearTimeout(t);
      reject(aborted());
    });
  });

const record = (id, modelType, { top, bottom, dress }, createdAt) => ({
  id,
  modelType,
  topProductId: top ?? null,
  bottomProductId: bottom ?? null,
  dressProductId: dress ?? null,
  imageUrl: fakeImage(id),
  createdAt,
});

// Mới nhất ở đầu. ti-seed-3 có món đã bán (sp-sold) → AI-05 "1 MÓN ĐÃ BÁN"
let images = [
  record(
    "ti-seed-1",
    M.FEMALE,
    { top: "sp-001", bottom: "sp-002" },
    ago(2, "hour"),
  ),
  record(
    "ti-seed-2",
    M.FEMALE,
    { top: "sp-004", bottom: "sp-011" },
    ago(2, "day"),
  ),
  record(
    "ti-seed-3",
    M.MALE,
    { top: "sp-010", bottom: "sp-sold" },
    ago(6, "day"),
  ),
  record("ti-seed-4", M.FEMALE, { dress: "sp-012" }, ago(9, "day")),
];

const toView = (img) => ({
  ...img,
  items: [img.dressProductId, img.topProductId, img.bottomProductId]
    .filter(Boolean)
    .map(mockProductSummary)
    .filter(Boolean),
});

const paginate = (list, page, size) => ({
  content: list.slice(page * size, (page + 1) * size),
  page,
  size,
  totalElements: list.length,
  totalPages: Math.ceil(list.length / size),
});

// ---------- API 96 ----------
export async function getSuggestions({ slot, excludeProductId }) {
  await delay();
  if (excludeProductId === NO_SUGGESTION_ID) return [];
  return mockOnSaleBySlot(slot, excludeProductId).slice(0, 6);
}

// Tab "Tất cả" (PHASE6_GUIDE 0.5 A7) — bản thật dùng API 49
export async function getSlotProducts({
  slot,
  excludeProductId,
  page = 0,
  size = 20,
}) {
  await delay();
  return paginate(mockOnSaleBySlot(slot, excludeProductId), page, size);
}

// ---------- API 97 ----------
export async function createTryonImage(payload, { signal } = {}) {
  await wait(5000 + Math.random() * 5000, signal); // 5–10 giây
  if (failNext) {
    failNext = false;
    throw new ApiError({
      status: 502,
      code: "HTTP_502",
      message: "Máy chủ AI đang bận, chưa tạo được ảnh.",
    });
  }
  const { dressProductId, topProductId, bottomProductId } = payload;
  if (!dressProductId && !(topProductId && bottomProductId)) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.INCOMPLETE_OUTFIT,
      message: "Cần đủ áo và quần, hoặc một chiếc đầm.",
    });
  }
  const ids = [dressProductId, topProductId, bottomProductId].filter(Boolean);
  if (
    ids.some((id) => mockProductSummary(id)?.status !== PRODUCT_STATUS.ON_SALE)
  ) {
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Một món trong bộ đồ vừa không còn bán.",
    });
  }
  seq += 1;
  const img = record(
    `ti-${Date.now()}`,
    payload.modelType,
    { top: topProductId, bottom: bottomProductId, dress: dressProductId },
    dayjs().toISOString(),
  );
  images.unshift(img);
  return toView(img);
}

// ---------- API 98 ----------
export async function getTryonImages({ page = 0, size = 20 } = {}) {
  await delay();
  return paginate(images.map(toView), page, size);
}

// [CHỜ BE câu 4] chưa có GET /tryon/images/{id}
export async function getTryonImage(id) {
  await delay(300);
  const img = images.find((x) => x.id === id);
  if (!img)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy ảnh thử đồ.",
    });
  return toView(img);
}

// ---------- API 99 ----------
export async function deleteTryonImage(id) {
  await delay();
  images = images.filter((x) => x.id !== id);
  return null;
}

// ---------- [DEV] ----------
export const mockFailNextTryon = () => {
  failNext = true;
};
