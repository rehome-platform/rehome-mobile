// Mock nhóm ký gửi (API 14–24) [CHỜ BE]. Cùng tên hàm + hình dạng dữ liệu với bản thật sau này.
// Dữ liệu "sống" trong RAM: tạo/sửa thấy ngay; reload app thì về dữ liệu mẫu.
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import {
  CONSIGN_LIMITS,
  END_OF_TERM_DECISION,
  FORM_STATUS,
} from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { BRANDS, CATEGORIES } from "@/features/catalog/api/catalogApi.mock";
import { seedForms, seedProducts, seedReceipts, WAREHOUSES } from "./mockData";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
let forms = seedForms();
let receipts = seedReceipts();
let products = seedProducts();

const SAMPLE_PDF =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; // PDF công khai để thử mở

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
      message: "Không tìm thấy yêu cầu ký gửi.",
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
      message: `Bạn đang có ${pendingCount} yêu cầu chờ duyệt, chưa tạo thêm được.`,
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
// API 18 — PUT /consignment-forms/{id}. Chỉ sửa khi PENDING, không đổi kho → khác thì 409 FORM_NOT_EDITABLE
export async function updateForm(id, payload) {
  await delay(800);
  const current = forms.find((f) => f.id === id);
  if (!current) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy yêu cầu ký gửi.",
    });
  }
  if (current.status !== FORM_STATUS.PENDING) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.FORM_NOT_EDITABLE,
      message: "Yêu cầu đã được ReHome xử lý, không sửa được nữa.",
    });
  }
  const updated = {
    ...current,
    productName: payload.productName,
    categoryId: payload.categoryId,
    categoryName:
      CATEGORIES.find((c) => c.id === payload.categoryId)?.name ?? null,
    brandId: payload.brandId,
    brandName: BRANDS.find((b) => b.id === payload.brandId)?.name ?? null,
    description: payload.description,
    desiredPrice: payload.desiredPrice,
    photoUrls: payload.photoUrls,
  };
  forms = forms.map((f) => (f.id === id ? updated : f));
  return { ...updated };
}
// API 19 — GET /consignment-receipts/{id}
export async function getReceipt(id) {
  await delay();
  const receipt = receipts.find((r) => r.id === id);
  if (!receipt) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy biên nhận.",
    });
  }
  return { ...receipt };
}

// API 20 — POST /consignment-receipts/{id}/confirm. Đã xác nhận → 409
export async function confirmReceipt(id) {
  await delay(800);
  const receipt = receipts.find((r) => r.id === id);
  if (!receipt) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy biên nhận.",
    });
  }
  if (receipt.confirmedAt) {
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Biên nhận đã được xác nhận trước đó.",
    });
  }
  const confirmedAt = new Date().toISOString();
  receipts = receipts.map((r) =>
    r.id === id ? { ...r, confirmedAt, pdfUrl: SAMPLE_PDF } : r,
  );
  forms = forms.map((f) =>
    f.receiptId === id ? { ...f, receiptConfirmed: true } : f,
  );
  // Biên nhận KÝ GỬI LẠI (có productId) → sản phẩm lên sàn lại: kỳ 1, giá mới, chu kỳ tính lại từ đầu
  if (receipt.productId) {
    const start = dayjs();
    products = products.map((p) =>
      p.id === receipt.productId
        ? {
            ...p,
            agreedPrice: receipt.agreedPrice,
            floorPrice: receipt.floorPrice,
            currentPrice: receipt.agreedPrice,
            currentTerm: 1,
            termStartedAt: start.toISOString(),
            endOfTermDeadline: start
              .add(receipt.termLengthDays, "day")
              .toISOString(),
            lastPriceChangedAt: null,
            priceChanges: [
              {
                changedAt: confirmedAt,
                oldPrice: null,
                newPrice: receipt.agreedPrice,
              },
            ],
            endOfTermDecision: null,
            termHistory: undefined,
          }
        : p,
    );
  }
  return { id, confirmedAt, pdfUrl: SAMPLE_PDF };
}
// API 21 — GET /products/mine?page&size. Mock trả đủ field; lọc theo trạng thái làm ở app
// (BE chưa chốt cách lọc "chờ cuối kỳ") [CHỜ BE]
export async function getMyProducts({ page = 0, size = 20 } = {}) {
  await delay();
  return paginate(
    products.map((p) => ({ ...p })),
    page,
    size,
  );
}

// API 22 — GET /products/{id}
export async function getProduct(id) {
  await delay();
  const product = products.find((p) => p.id === id);
  if (!product) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy sản phẩm.",
    });
  }
  // Phase 6: id kho để mở hộp thư kho [CHỜ BE] API 22 trả warehouseId
  return {
    ...product,
    warehouseId:
      product.warehouseId ??
      WAREHOUSES.find((w) => w.name === product.warehouseName)?.id ??
      null,
  };
}
// API 23 — POST /products/{id}/price-reduction {newPrice}. Kiểm như BE: chỉ giảm, ≥ giá sàn, 1 lần/ngày
export async function reducePrice(id, newPrice) {
  await delay(800);
  const p = products.find((x) => x.id === id);
  if (!p)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy sản phẩm.",
    });
  if (newPrice >= p.currentPrice) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Giá mới phải thấp hơn giá hiện tại.",
    });
  }
  if (newPrice < p.floorPrice) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.BELOW_FLOOR_PRICE,
      message: "Giá mới thấp hơn giá sàn.",
    });
  }
  if (
    p.lastPriceChangedAt &&
    dayjs(p.lastPriceChangedAt).isSame(dayjs(), "day")
  ) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.PRICE_CHANGE_LIMIT_REACHED,
      message: "Hôm nay bạn đã đổi giá rồi.",
    });
  }
  const now = new Date().toISOString();
  products = products.map((x) =>
    x.id === id
      ? {
          ...x,
          currentPrice: newPrice,
          lastPriceChangedAt: now,
          priceChanges: [
            { changedAt: now, oldPrice: x.currentPrice, newPrice },
            ...(x.priceChanges ?? []),
          ],
        }
      : x,
  );
  return { currentPrice: newPrice };
}
// API 24 — POST /end-of-term-decisions/{id}/decide {decision}. Quá hạn → 409 DECISION_EXPIRED
export async function decideEndOfTerm(decisionId, decision) {
  await delay(800);
  const p = products.find((x) => x.endOfTermDecision?.id === decisionId);
  if (!p)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy yêu cầu xử lý cuối kỳ.",
    });
  const d = p.endOfTermDecision;
  if (dayjs().isAfter(d.deadline)) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.DECISION_EXPIRED,
      message:
        "Đã quá hạn chọn cách xử lý, hàng chuyển sang xử lý vô thừa nhận.",
    });
  }
  if (d.decision) {
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Bạn đã chọn cách xử lý cho sản phẩm này rồi.",
    });
  }
  const now = dayjs();
  const updated = {
    ...d,
    decision,
    decidedAt: now.toISOString(),
    // [GIẢ ĐỊNH] hạn đến kho lấy hàng = 7 ngày kể từ khi chọn (theo KG-11)
    pickupDeadline:
      decision === END_OF_TERM_DECISION.TAKE_BACK
        ? now.add(7, "day").toISOString()
        : null,
  };
  products = products.map((x) =>
    x.id === p.id ? { ...x, endOfTermDecision: updated } : x,
  );
  return { decision, newReceiptId: null };
}

// [CHỈ MOCK] Giả lập Moderator đề xuất giá mới cho sản phẩm đã chọn ký gửi lại → tạo biên nhận mới
export async function mockProposeNewPrice(productId) {
  await delay(500);
  const p = products.find((x) => x.id === productId);
  const price = Math.floor((p.currentPrice * 0.8) / 1000) * 1000;
  const receiptId = `rc-${Date.now()}`;
  receipts = [
    {
      id: receiptId,
      formId: null,
      productId: p.id, // biên nhận ký gửi lại gắn với sản phẩm, không gắn form
      receiptNo: `KG-2026-${String(Date.now()).slice(-6)}`,
      productName: p.name,
      brandName: p.brandName,
      size: p.size,
      sku: p.id,
      conditionNote: "Còn tốt, giữ nguyên tình trạng lúc ký gửi",
      warehouseName: p.warehouseName,
      agreedPrice: price,
      floorPrice: Math.floor(price * 0.5),
      termLengthDays: 30,
      maxRenewals: 2,
      freeWithdrawalWindowDays: 7,
      commissionRateTerm1: 0.1,
      commissionRateTerm2: 0.15,
      commissionRateTerm3: 0.2,
      withdrawalFee: 30000,
      degradedCompensationRate: 0.5,
      previousPrice: p.currentPrice, // [CHỜ BE] giá cũ + ghi chú Moderator (KG-12)
      moderatorNote: "Hàng còn đẹp, đề xuất hạ giá để dễ bán hơn.",
      confirmedAt: null,
      pdfUrl: null,
      createdAt: new Date().toISOString(),
    },
    ...receipts,
  ];
  products = products.map((x) =>
    x.id === productId
      ? {
          ...x,
          endOfTermDecision: {
            ...x.endOfTermDecision,
            newReceiptId: receiptId,
          },
        }
      : x,
  );
}
// ---------- Phase 5 (rút hàng) ----------
// withdrawalApi.mock dùng: đọc / sửa sản phẩm trong RAM (mảng products được thay mới mỗi lần sửa)
export const mockFindMyProduct = (id) => {
  const p = products.find((x) => x.id === id);
  return p ? { ...p } : null;
};
export const mockPatchProduct = (id, patch) => {
  products = products.map((x) => (x.id === id ? { ...x, ...patch } : x));
};
