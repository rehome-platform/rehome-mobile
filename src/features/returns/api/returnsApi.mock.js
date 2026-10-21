// Mock trả hàng (API 79–82) "sống" trong RAM, nối với mock đơn (ordersApi.mock) và ví (walletApi.mock):
// kết luận hợp lệ / thất lạc → giao dịch REFUND = tổng đơn. Field theo entity ReturnRequest của BE (2c3b597)
// + field mobile xin thêm [CHỜ BE PHASE5_GUIDE câu 6]. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";
import {
  INVALID_RETURN_CHOICE,
  RETURN_CANCEL_REASON,
  RETURN_LIMITS,
  RETURN_STATUS as R,
} from "@/constants/returns";
import { mockFindOrder } from "@/features/orders/api/ordersApi.mock";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import { mockRefund } from "@/features/wallet/api/walletApi.mock";
import { canRequestReturn } from "../utils/returnRules";
import { mockNotify } from "@/features/notifications/api/notificationApi.mock";
import {
  NOTIFICATION_TARGET as NT,
  NOTIFICATION_TYPE as NN,
} from "@/constants/notification";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => dayjs().toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const photo = (seed) => `https://picsum.photos/seed/${seed}/400`;
const trackingCode = () =>
  `GHNR${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

const notFound = () =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: "Không tìm thấy yêu cầu trả hàng.",
  });
const conflict = (code, message) =>
  new ApiError({ status: 409, code, message });
const badRequest = (message) =>
  new ApiError({ status: 400, code: "HTTP_400", message });

// Field mặc định (đủ cho mọi trạng thái)
const blank = () => ({
  code: null, // [CHỜ BE] mã hiển thị YC-…
  photoUrls: [],
  approvedAt: null, // [CHỜ BE] 3 mốc này entity chưa có
  handedOverAt: null,
  inspectedAt: null,
  resolvedAt: null,
  handoverDeadline: null,
  ghnReturnTrackingCode: null,
  resolutionNote: null,
  resolutionPhotoUrls: [], // [CHỜ BE] ảnh kho chụp khi nhận lại
  refundAmount: null, // [CHỜ BE]
  invalidReturnChoice: null,
  pickupDeadline: null, // [GIẢ ĐỊNH] đặt lúc kết luận Không hợp lệ: hạn chọn + đến lấy (7 ngày)
  cancelReason: null, // [CHỜ BE] RETURN_CANCEL_REASON
  cancelNote: null,
});

let seq = 83;
const nextCode = () => {
  seq += 1;
  return `YC-${String(seq).padStart(5, "0")}`;
};

// rr-seed-<n> gắn với đơn od-seed-<10+n> (ordersApi.mock)
const seedReturn = (n, fields) => ({
  ...blank(),
  id: `rr-seed-${n}`,
  code: nextCode(),
  orderId: `od-seed-${10 + n}`,
  ...fields,
});

const REASON_1 =
  "Không đúng mô tả hoặc ảnh: Ảnh đăng là màu xanh đậm nhưng hàng nhận được bạc màu nhiều ở hai bên ống, mô tả không ghi.";

let returns = [
  seedReturn(1, {
    status: R.PENDING,
    reason: REASON_1,
    photoUrls: [photo("rt1a"), photo("rt1b")],
    createdAt: ago(5, "hour"),
  }),
  seedReturn(2, {
    status: R.APPROVED,
    reason:
      "Tình trạng tệ hơn kết luận kiểm định: Lót trong bị rách một đường dài ở nách trái.",
    photoUrls: [photo("rt2a")],
    createdAt: ago(30, "hour"),
    approvedAt: ago(10, "hour"),
    handoverDeadline: later(62, "hour"), // ≈ "Còn 2 ngày 14 giờ" như wireframe
    ghnReturnTrackingCode: "GHNR5K8M2Q",
  }),
  seedReturn(3, {
    status: R.SHIPPED_BACK,
    reason: "Nhận sai món: Đặt áo màu trắng nhưng nhận áo màu kem.",
    photoUrls: [photo("rt3a")],
    createdAt: ago(90, "hour"),
    approvedAt: ago(80, "hour"),
    handedOverAt: ago(30, "hour"),
    ghnReturnTrackingCode: "GHNR7Q1X9P",
  }),
  seedReturn(4, {
    status: R.VALID,
    reason: "Hỏng hoặc bẩn khi vận chuyển: Vết dầu lớn ở thân trước.",
    photoUrls: [photo("rt4a"), photo("rt4b")],
    createdAt: ago(190, "hour"),
    approvedAt: ago(170, "hour"),
    handedOverAt: ago(150, "hour"),
    inspectedAt: ago(100, "hour"),
    resolvedAt: ago(95, "hour"),
    ghnReturnTrackingCode: "GHNR2M6T4A",
    refundAmount: 415000, // = tổng đơn od-seed-14 (390.000 + ship 25.000)
  }),
  seedReturn(5, {
    status: R.INVALID,
    reason: "Không đúng mô tả hoặc ảnh: Ve áo bị sờn, ảnh đăng không thấy.",
    photoUrls: [photo("rt5a")],
    createdAt: ago(140, "hour"),
    approvedAt: ago(120, "hour"),
    handedOverAt: ago(100, "hour"),
    inspectedAt: ago(20, "hour"),
    resolvedAt: ago(11, "hour"),
    ghnReturnTrackingCode: "GHNR9B3C7D",
    resolutionNote:
      "Có dấu vết sử dụng sau khi nhận. Áo có vết bùn khô và sơn mới, không có trong ảnh kiểm định lúc nhập kho. Phần sờn ở ve áo đúng như mô tả và đã ghi trong mục Tình trạng khi đăng bán.",
    resolutionPhotoUrls: [photo("rt5k1"), photo("rt5k2"), photo("rt5k3")],
    pickupDeadline: later(157, "hour"), // ≈ "Còn 6 ngày 13 giờ"
  }),
  seedReturn(6, {
    status: R.LOST,
    reason: "Hỏng hoặc bẩn khi vận chuyển: Rách đường may ở vai.",
    photoUrls: [photo("rt6a")],
    createdAt: ago(290, "hour"),
    approvedAt: ago(270, "hour"),
    handedOverAt: ago(250, "hour"),
    resolvedAt: ago(100, "hour"),
    ghnReturnTrackingCode: "GHNR4E8F1G",
    refundAmount: 635000, // = tổng đơn od-seed-16
  }),
];

// Kèm thông tin đơn để màn hình khỏi gọi thêm [CHỜ BE câu 6: API 80 trả orderNo, món, địa chỉ]
const withOrder = (r) => {
  const o = mockFindOrder(r.orderId);
  const a = o?.shippingAddress; // đơn đặt từ app chỉ có shippingAddressId → null
  return {
    ...r,
    photoUrls: [...r.photoUrls],
    resolutionPhotoUrls: [...r.resolutionPhotoUrls],
    orderNo: o?.orderNo ?? null,
    warehouseName: o?.warehouseName ?? null,
    warehouseId: o?.warehouseId ?? null, // Phase 6: mở hộp thư kho [CHỜ BE]
    // RT-04 cần địa chỉ / giờ mở cửa kho đang giữ hàng [CHỜ BE câu 6]
    warehouseAddress:
      WAREHOUSES.find((w) => w.id === o?.warehouseId)?.address ?? null,
    warehouseOpeningHours:
      WAREHOUSES.find((w) => w.id === o?.warehouseId)?.openingHours ?? null,
    shipBackFee: 30000, // [CHỜ BE câu 9] phí kho gửi lại — số theo wireframe

    items: o?.items ?? [],
    subtotal: o?.subtotal ?? null,
    shippingFee: o?.shippingFee ?? null,
    totalAmount: o?.totalAmount ?? null,
    // tên field theo bản chụp địa chỉ của Order (BE 2c3b597)
    shippingRecipientName: a?.recipientName ?? null,
    shippingPhone: a?.phone ?? null,
    shippingAddressDetail: a?.addressDetail ?? null,
  };
};

const toSummary = (r) => {
  const full = withOrder(r);
  return {
    id: r.id,
    code: r.code,
    orderId: r.orderId,
    orderNo: full.orderNo,
    status: r.status,
    createdAt: r.createdAt,
    handoverDeadline: r.handoverDeadline,
    invalidReturnChoice: r.invalidReturnChoice,
    pickupDeadline: r.pickupDeadline,
    itemCount: full.items.length,
    firstItem: full.items[0] ?? null,
  };
};

// Quá hạn bàn giao → tự huỷ (BE sẽ có job). Đơn giữ returnRequestId → không gửi lại được (F-069)
const expireIfLate = (r) => {
  if (r.status === R.APPROVED && dayjs().isAfter(r.handoverDeadline)) {
    r.status = R.CANCELLED;
    r.cancelReason = RETURN_CANCEL_REASON.HANDOVER_EXPIRED;
  }
};

const findReturn = (id) => {
  const r = returns.find((x) => x.id === id);
  if (!r) throw notFound();
  expireIfLate(r);
  return r;
};

// Hoàn 100% tổng đơn (tiền hàng + ship gốc) vào ví mock
const refund = (r) => {
  const o = mockFindOrder(r.orderId);
  r.refundAmount = o?.totalAmount ?? 0;
  mockRefund({
    orderId: r.orderId,
    orderNo: o?.orderNo,
    amount: r.refundAmount,
    note: "Hoàn tiền trả hàng",
  });
};

// ---------- API 79 ----------
export async function createReturn(orderId, { reason, photoUrls = [] }) {
  await delay(800);
  const o = mockFindOrder(orderId);
  if (!o)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy đơn hàng.",
    });
  if (o.returnRequestId) {
    throw conflict(
      ERROR_CODES.RETURN_ALREADY_EXISTS,
      "Đơn này đã có yêu cầu trả hàng.",
    );
  }
  if (!canRequestReturn(o)) {
    throw conflict(
      ERROR_CODES.RETURN_WINDOW_EXPIRED,
      "Đã quá hạn yêu cầu trả hàng.",
    );
  }
  if (!reason?.trim()) throw badRequest("Vui lòng nhập lý do trả hàng.");
  if (
    photoUrls.length < RETURN_LIMITS.MIN_PHOTOS ||
    photoUrls.length > RETURN_LIMITS.MAX_PHOTOS
  ) {
    throw badRequest("Cần 1–5 ảnh chứng minh.");
  }
  const r = {
    ...blank(),
    id: `rr-${Date.now()}`,
    code: nextCode(),
    orderId,
    status: R.PENDING,
    reason: reason.trim(),
    photoUrls: [...photoUrls],
    createdAt: nowIso(),
  };
  returns.push(r);
  o.returnRequestId = r.id;
  return { id: r.id, status: r.status, handoverDeadline: r.handoverDeadline };
}

// ---------- API 80 ----------
export async function getReturns({ statuses = [], page = 0, size = 10 } = {}) {
  await delay();
  returns.forEach(expireIfLate);
  const list = returns
    .filter((r) => !statuses.length || statuses.includes(r.status))
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt)); // mới nhất trước
  return {
    content: list.slice(page * size, (page + 1) * size).map(toSummary),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
  };
}

export async function getReturn(id) {
  await delay(400);
  return withOrder(findReturn(id));
}

// ---------- API 81: Member báo đã giao hàng cho shipper ----------
export async function confirmHandover(id) {
  await delay();
  const r = findReturn(id);
  if (r.status === R.CANCELLED) {
    throw conflict(
      ERROR_CODES.RETURN_HANDOVER_EXPIRED,
      "Đã quá hạn bàn giao, yêu cầu đã tự huỷ.",
    );
  }
  if (r.status !== R.APPROVED)
    throw conflict("HTTP_409", "Yêu cầu không ở bước bàn giao.");
  r.status = R.SHIPPED_BACK;
  r.handedOverAt = nowIso();
  return {
    id: r.id,
    status: r.status,
    ghnReturnTrackingCode: r.ghnReturnTrackingCode,
  };
}

// ---------- API 82: chọn cách nhận lại hàng không hợp lệ ----------
export async function chooseInvalidReturn(id, choice) {
  await delay();
  const r = findReturn(id);
  if (r.status !== R.INVALID || r.invalidReturnChoice) {
    throw conflict("HTTP_409", "Yêu cầu không ở bước chọn cách nhận lại.");
  }
  if (dayjs().isAfter(r.pickupDeadline)) {
    throw conflict("HTTP_409", "Đã quá hạn chọn cách nhận lại.");
  }
  if (choice === INVALID_RETURN_CHOICE.SHIP_BACK) {
    // [CHỜ BE câu 9] chưa có API trả phí gửi lại
    throw conflict("HTTP_409", "Kho gửi lại chưa hỗ trợ.");
  }
  r.invalidReturnChoice = choice;
  return {
    id: r.id,
    invalidReturnChoice: choice,
    pickupDeadline: r.pickupDeadline,
  };
}

// ---------- [DEV] khung Mock: giả lập kho / GHN ----------
// from: trạng thái được phép bấm. Màn RT-02 chỉ hiện nút hợp với trạng thái hiện tại
export const MOCK_RETURN_ACTIONS = [
  { key: "APPROVE", label: "Kho duyệt", from: [R.PENDING] },
  { key: "REJECT", label: "Kho từ chối", from: [R.PENDING] },
  { key: "EXPIRE_HANDOVER", label: "Quá hạn bàn giao", from: [R.APPROVED] },
  { key: "ARRIVE", label: "Hàng về kho", from: [R.SHIPPED_BACK] },
  { key: "LOST", label: "Thất lạc", from: [R.SHIPPED_BACK] },
  { key: "VALID", label: "Kết luận hợp lệ", from: [R.INSPECTING] },
  { key: "INVALID", label: "Kết luận không hợp lệ", from: [R.INSPECTING] },
];

export async function mockReturnAction(id, key) {
  await delay(300);
  const r = findReturn(id);
  const action = MOCK_RETURN_ACTIONS.find((a) => a.key === key);
  if (!action?.from.includes(r.status)) {
    throw conflict("HTTP_409", "Không áp dụng cho trạng thái hiện tại.");
  }
  const t = nowIso();
  switch (key) {
    case "APPROVE":
      r.status = R.APPROVED;
      r.approvedAt = t;
      r.handoverDeadline = later(RETURN_LIMITS.HANDOVER_DAYS, "day");
      r.ghnReturnTrackingCode = trackingCode();
      break;
    case "REJECT":
      r.status = R.CANCELLED;
      r.cancelReason = RETURN_CANCEL_REASON.REJECTED;
      r.cancelNote =
        "Ảnh chứng minh chưa cho thấy món khác với mô tả và kết luận kiểm định.";
      break;
    case "EXPIRE_HANDOVER":
      r.handoverDeadline = ago(1, "minute");
      expireIfLate(r);
      break;
    case "ARRIVE":
      r.status = R.INSPECTING;
      r.inspectedAt = t;
      break;
    case "LOST":
      r.status = R.LOST;
      r.resolvedAt = t;
      refund(r);
      break;
    case "VALID":
      r.status = R.VALID;
      r.resolvedAt = t;
      refund(r);
      break;
    case "INVALID":
      r.status = R.INVALID;
      r.resolvedAt = t;
      r.resolutionNote =
        "Có dấu vết sử dụng sau khi nhận, không có trong ảnh kiểm định lúc nhập kho.";
      r.resolutionPhotoUrls = [photo(`${r.id}k1`), photo(`${r.id}k2`)];
      r.pickupDeadline = later(RETURN_LIMITS.PICKUP_DAYS, "day");
      break;
  }
  // Phase 6: kết quả từ kho → thông báo
  const TEXT = {
    APPROVE: [
      "Yêu cầu trả hàng đã được duyệt",
      `Giao hàng cho shipper trước hạn để kho nhận lại (${r.code}).`,
    ],
    REJECT: [
      "Yêu cầu trả hàng bị từ chối",
      `Kho từ chối yêu cầu ${r.code}. Xem lý do trong chi tiết.`,
    ],
    VALID: [
      "Đã hoàn tiền trả hàng",
      `Kho xác nhận hợp lệ, tiền đã hoàn vào ví (${r.code}).`,
    ],
    INVALID: [
      "Yêu cầu trả hàng không hợp lệ",
      `Chọn cách nhận lại hàng trong 7 ngày (${r.code}).`,
    ],
    LOST: ["Hàng trả bị thất lạc", `ReHome vẫn hoàn tiền cho bạn (${r.code}).`],
  };
  if (TEXT[key]) {
    mockNotify({
      type: NN.ORDER_UPDATE,
      title: TEXT[key][0],
      body: TEXT[key][1],
      targetType: NT.RETURN_REQUEST,
      targetId: r.id,
    });
  }
  return withOrder(r);
}
