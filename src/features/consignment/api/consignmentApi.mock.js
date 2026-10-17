// Mock nhóm ký gửi (API 14–24) [CHỜ BE]. Cùng tên hàm + hình dạng dữ liệu với bản thật sau này.
// Dữ liệu "sống" trong RAM: tạo/sửa thấy ngay; reload app thì về dữ liệu mẫu.
import { ApiError } from "@/lib/api/errors";
import { CONSIGN_LIMITS, FORM_STATUS } from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { BRANDS, CATEGORIES } from "@/features/catalog/api/catalogApi.mock";
import { seedForms, WAREHOUSES } from "./mockData";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
let forms = seedForms();

// API 16 trả 1 dòng tóm tắt. Ngoài {id, status, productName, desiredPrice} của API_CONTRACT,
// các field còn lại là bản mobile xin thêm [CHỜ BE] — FormCard phải chịu được khi thiếu
const toListItem = (f) => ({
  id: f.id,
  status: f.status,
  productName: f.productName,
  desiredPrice: f.desiredPrice,
  thumbnailUrl: f.photoUrls[0] ?? null,
  warehouseName: f.warehouse?.name ?? null,
  bringInDeadline: f.bringInDeadline,
  rejectReason: f.rejectReason,
  createdAt: f.createdAt,
});

// Giống PageResponse của BE: page bắt đầu từ 0
const paginate = (items, page, size) => ({
  content: items.slice(page * size, (page + 1) * size),
  page,
  size,
  totalElements: items.length,
  totalPages: Math.ceil(items.length / size),
});

// API 16 — GET /consignment-forms?status&page&size (mới nhất lên đầu)
export async function getMyForms({ status, page = 0, size = 20 } = {}) {
  await delay();
  const items = forms
    .filter((f) => !status || f.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toListItem);
  return paginate(items, page, size);
}

// API 17 — GET /consignment-forms/{id}
export async function getForm(id) {
  await delay();
  const form = forms.find((f) => f.id === id);
  if (!form) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy form ký gửi.",
    });
  }
  return { ...form };
}
// Khoảng cách 2 toạ độ theo đường chim bay (công thức haversine), đơn vị km
const distanceKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// API 14 — GET /warehouses/nearest?lat&lng. Không có vị trí → trả danh sách, distanceKm = null [CHỜ BE hỗ trợ]
export async function getNearestWarehouses({ lat, lng } = {}) {
  await delay();
  if (lat == null || lng == null)
    return WAREHOUSES.map((w) => ({ ...w, distanceKm: null }));
  return WAREHOUSES.map((w) => ({
    ...w,
    distanceKm:
      Math.round(
        distanceKm({ lat, lng }, { lat: w.latitude, lng: w.longitude }) * 10,
      ) / 10,
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}

// API 15 — POST /consignment-forms. Đủ 5 form chờ duyệt → 409 TOO_MANY_PENDING_FORMS (giống BE)
export async function createForm(payload) {
  await delay(800);
  const pendingCount = forms.filter(
    (f) => f.status === FORM_STATUS.PENDING,
  ).length;
  if (pendingCount >= CONSIGN_LIMITS.MAX_PENDING_FORMS) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.TOO_MANY_PENDING_FORMS,
      message: `Bạn đang có ${pendingCount} form chờ duyệt, chưa tạo thêm được.`,
    });
  }
  const form = {
    id: `form-${Date.now()}`,
    status: FORM_STATUS.PENDING,
    productName: payload.productName,
    categoryId: payload.categoryId,
    categoryName:
      CATEGORIES.find((c) => c.id === payload.categoryId)?.name ?? null,
    brandId: payload.brandId,
    brandName: BRANDS.find((b) => b.id === payload.brandId)?.name ?? null,
    description: payload.description,
    desiredPrice: payload.desiredPrice,
    photoUrls: payload.photoUrls,
    warehouse: WAREHOUSES.find((w) => w.id === payload.warehouseId) ?? null,
    bringInDeadline: null,
    rejectReason: null,
    receiptId: null,
    createdAt: new Date().toISOString(),
  };
  forms = [form, ...forms];
  return {
    id: form.id,
    status: form.status,
    bringInDeadline: null,
    createdAt: form.createdAt,
  };
}
