// Mock đơn hàng. Phase 3: API 59 (đặt hàng, GIỐNG BE: tách đơn theo kho, phí ship 25.000/đơn, giữ hàng 15 phút,
// 1 món không còn bán → 409 cả lần). Phase 4: API 62–67 (danh sách, chi tiết, theo dõi, huỷ, xác nhận, đánh giá).
// Field theo entity Order của BE (2bfc66c) + các field mobile xin thêm [CHỜ BE] (PHASE4_GUIDE 5.2b).
// Dùng chung dữ liệu với productsApi.mock và cartApi.mock. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { ORDER_STATUS as S } from "@/constants/order";
import { ERROR_CODES } from "@/constants/errorCodes";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import { mockFindProduct } from "@/features/products/api/productsApi.mock";
import {
  mockCartProductIds,
  mockRemoveFromCart,
} from "@/features/cart/api/cartApi.mock";
import { mockRefund } from "@/features/wallet/api/walletApi.mock";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const SHIPPING_FEE = 25000; // giống cấu hình BE app.order.shipping-fee
const DEADLINE_MINUTES = 15;

const now = () => dayjs().toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const photo = (seed) => `https://picsum.photos/seed/${seed}/400`;
const warehouseName = (id) =>
  WAREHOUSES.find((w) => w.id === id)?.name ?? "Kho ReHome";
const notFound = () =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: "Không tìm thấy đơn hàng.",
  });
const conflict = (code, message) =>
  new ApiError({ status: 409, code, message });

// Field mặc định của một đơn (đủ cho mọi trạng thái)
const blank = () => ({
  shippingAddress: null, // bản chụp địa chỉ [CHỜ BE câu 4c]; đơn đặt từ app chỉ có shippingAddressId
  shippingAddressId: null,
  paymentMethod: null,
  paymentDeadline: null,
  paidAt: null,
  ghnTrackingCode: null,
  expectedDeliveryDate: null,
  trackingEvents: [], // [{status, label, location, timestamp}]
  hasIssue: false,
  issueNote: null,
  deliveredAt: null,
  autoCompleteDeadline: null,
  completedAt: null,
  serviceRating: null,
  ratedAt: null,
  cancelReason: null,
  cancelledAt: null,
  refundAmount: null,
});

// ---------- Dữ liệu mẫu: mỗi trạng thái ít nhất 1 đơn ----------
const SEED_ADDRESS = {
  recipientName: "Trần Thị B",
  phone: "0912345678",
  addressDetail: "128 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Hồ Chí Minh",
};
const item = (name, price, brandName, size, condition, seed) => ({
  productId: null, // món cũ đã bán — không mở lại chi tiết
  name,
  thumbnailUrl: photo(seed),
  brandName,
  size,
  condition,
  price,
});
const ev = (status, label, location, hoursAgo) => ({
  status,
  label,
  location,
  timestamp: ago(hoursAgo, "hour"),
});

let seq = 0;
function seed({ status, warehouseId, items, createdHoursAgo, ...rest }) {
  seq += 1;
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  return {
    ...blank(),
    id: `od-seed-${seq}`,
    orderNo: `OD-${dayjs().year()}-${String(seq).padStart(6, "0")}`,
    warehouseId,
    warehouseName: warehouseName(warehouseId),
    items,
    productIds: [],
    subtotal,
    shippingFee: SHIPPING_FEE,
    totalAmount: subtotal + SHIPPING_FEE,
    status,
    paymentMethod: "MOMO",
    shippingAddress: SEED_ADDRESS,
    createdAt: ago(createdHoursAgo, "hour"),
    ...rest,
  };
}

let orders = [
  seed({
    status: S.PENDING_PAYMENT,
    warehouseId: "wh-q1",
    items: [item("Áo sơ mi linen", 382000, "Zara", "M", "Tốt", "od1")],
    createdHoursAgo: 0,
    paymentMethod: null,
    paymentDeadline: later(12, "minute"),
  }),
  seed({
    status: S.PAID,
    warehouseId: "wh-q1",
    items: [item("Áo khoác bomber", 780000, "H&M", "M", "Tốt", "od2")],
    createdHoursAgo: 2,
    paidAt: ago(2, "hour"),
  }),
  seed({
    status: S.PACKING,
    warehouseId: "wh-bt",
    items: [
      item(
        "Túi tote canvas",
        250000,
        "Thương hiệu Việt",
        "Free",
        "Như mới",
        "od3",
      ),
    ],
    createdHoursAgo: 20,
    paidAt: ago(20, "hour"),
  }),
  seed({
    status: S.SHIPPING,
    warehouseId: "wh-td",
    items: [item("Áo len cổ lọ", 550000, "Uniqlo", "L", "Tốt", "od4")],
    createdHoursAgo: 48,
    paidAt: ago(48, "hour"),
    ghnTrackingCode: "GHN5J82K7PQ",
    expectedDeliveryDate: later(1, "day"),
    trackingEvents: [
      ev("PICKED_UP", "GHN đã lấy hàng", "Kho Thủ Đức", 30),
      ev("SORTED", "Đã rời kho phân loại", "Kho phân loại HCM", 20),
      ev("DELIVERING", "Đang giao đến bạn", "Bưu cục Thủ Đức", 2),
    ],
  }),
  seed({
    status: S.SHIPPING,
    warehouseId: "wh-q1",
    items: [
      item("Giày chạy bộ", 990000, "Nike", "42", "Như mới, đế còn 95%", "od5"),
    ],
    createdHoursAgo: 96,
    paidAt: ago(96, "hour"),
    ghnTrackingCode: "GHN5590712435",
    hasIssue: true,
    issueNote:
      "GHN báo không liên lạc được người nhận sau 2 lần giao. Quá 3 ngày nữa mà không giao được, kiện hàng trả về kho và tiền hoàn vào ví bạn.",
    trackingEvents: [
      ev("PICKED_UP", "GHN đã lấy hàng", "Kho Quận 1", 80),
      ev("SORTED", "Đã rời kho phân loại", "Kho phân loại HCM", 70),
      ev(
        "FAILED_DELIVERY",
        "Giao không thành công — lần 1",
        "Bưu cục Quận 1",
        50,
      ),
      ev(
        "FAILED_DELIVERY",
        "Giao không thành công — lần 2",
        "Bưu cục Quận 1 · không liên lạc được",
        26,
      ),
    ],
  }),
  seed({
    status: S.DELIVERED,
    warehouseId: "wh-q1",
    items: [item("Quần jeans ống rộng", 420000, "Levi's", "29", "Tốt", "od6")],
    createdHoursAgo: 72,
    paidAt: ago(72, "hour"),
    ghnTrackingCode: "GHN7Q1M2X9",
    deliveredAt: ago(17, "hour"),
    autoCompleteDeadline: later(55, "hour"), // ≈ "2 ngày 7 giờ" như wireframe
    trackingEvents: [
      ev("PICKED_UP", "GHN đã lấy hàng", "Kho Quận 1", 50),
      ev("DELIVERED", "Giao thành công", "Bưu cục Quận 1", 17),
    ],
  }),
  seed({
    status: S.COMPLETED,
    warehouseId: "wh-q1",
    items: [item("Váy hoa nhí", 680000, "Zara", "S", "Như mới", "od7")],
    createdHoursAgo: 240,
    paidAt: ago(240, "hour"),
    ghnTrackingCode: "GHN3K8P1Z2",
    deliveredAt: ago(200, "hour"),
    completedAt: ago(190, "hour"),
  }),
  seed({
    status: S.COMPLETED,
    warehouseId: "wh-bt",
    items: [
      item("Áo hoodie nỉ", 450000, "Adidas", "XL", "Tốt", "od8a"),
      item("Áo thun basic", 120000, "Uniqlo", "L", "Khá", "od8b"),
    ],
    createdHoursAgo: 400,
    paidAt: ago(400, "hour"),
    ghnTrackingCode: "GHN9A7B5C3",
    deliveredAt: ago(350, "hour"),
    completedAt: ago(340, "hour"),
    serviceRating: 4,
    ratedAt: ago(339, "hour"),
  }),
  seed({
    status: S.CANCELLED,
    warehouseId: "wh-td",
    items: [item("Áo khoác jean", 520000, "Levi's", "M", "Tốt", "od9")],
    createdHoursAgo: 230,
    paidAt: ago(230, "hour"),
    cancelReason: "BUYER_CANCELLED",
    cancelledAt: ago(229, "hour"),
    refundAmount: 545000, // 100% gồm phí ship
  }),
  seed({
    status: S.CANCELLED,
    warehouseId: "wh-bt",
    items: [
      item(
        "Kính râm gọng tròn",
        200000,
        "Không rõ thương hiệu",
        "Free",
        "Như mới",
        "od10",
      ),
    ],
    createdHoursAgo: 300,
    paymentMethod: null,
    cancelReason: "PAYMENT_EXPIRED",
    cancelledAt: ago(299, "hour"),
  }),
];

let failNext = false;

// [DEV] Lần đặt kế tiếp: món đầu tiên "vừa bị người khác mua" → 409 (test trạng thái Giữ hàng thất bại)
export const mockFailNextOrder = () => {
  failNext = true;
};

const toCreateResponse = (o) => ({
  id: o.id,
  orderNo: o.orderNo,
  warehouseId: o.warehouseId,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  totalAmount: o.totalAmount,
  status: o.status,
  paymentDeadline: o.paymentDeadline,
});

// API 62: 1 dòng tóm tắt (contract chỉ có id, orderNo, status, totalAmount — phần còn lại mobile xin thêm, câu 4)
const toSummary = (o) => ({
  id: o.id,
  orderNo: o.orderNo,
  status: o.status,
  totalAmount: o.totalAmount,
  warehouseName: o.warehouseName,
  createdAt: o.createdAt,
  paymentDeadline: o.paymentDeadline,
  ghnTrackingCode: o.ghnTrackingCode,
  expectedDeliveryDate: o.expectedDeliveryDate,
  deliveredAt: o.deliveredAt,
  autoCompleteDeadline: o.autoCompleteDeadline,
  serviceRating: o.serviceRating,
  refundAmount: o.refundAmount,
  itemCount: o.items.length,
  firstItem: o.items[0] ?? null,
});

// API 63: đủ field (bỏ phần nội bộ của theo dõi — đã có API 64)
const toDetail = (o) => {
  const { trackingEvents, hasIssue, issueNote, ...rest } = o;
  return rest;
};

const setProductsStatus = (o, status) =>
  o.productIds.forEach((id) => {
    const p = mockFindProduct(id);
    if (p) p.status = status;
  });

// Quá hạn mà chưa trả → huỷ, nhả hàng (BE sẽ có job làm việc này)
const expireIfLate = (o) => {
  if (o.status === S.PENDING_PAYMENT && dayjs().isAfter(o.paymentDeadline)) {
    o.status = S.CANCELLED;
    o.cancelReason = "PAYMENT_EXPIRED";
    o.cancelledAt = now();
    setProductsStatus(o, PRODUCT_STATUS.ON_SALE);
  }
};

const findOrder = (id) => {
  const o = orders.find((x) => x.id === id);
  if (!o) throw notFound();
  expireIfLate(o);
  return o;
};

// ---------- Phase 3: đặt hàng ----------
export async function createOrders({ shippingAddressId, productIds }) {
  await delay(800);
  if (!shippingAddressId) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "shippingAddressId là bắt buộc.",
    });
  }
  const buyNow = productIds?.length > 0;
  const ids = buyNow ? productIds : mockCartProductIds();
  if (!ids.length) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Giỏ hàng trống.",
    });
  }
  const products = ids.map((id) => {
    const p = mockFindProduct(id);
    if (!p)
      throw new ApiError({
        status: 404,
        code: "HTTP_404",
        message: "Không tìm thấy sản phẩm.",
      });
    return p;
  });

  if (failNext) {
    failNext = false;
    products[0].status = PRODUCT_STATUS.RESERVED; // người khác vừa đặt món này
  }
  if (products.some((p) => p.status !== PRODUCT_STATUS.ON_SALE)) {
    throw conflict(
      ERROR_CODES.PRODUCT_NOT_AVAILABLE ?? "HTTP_409",
      "Sản phẩm không còn để bán.",
    );
  }

  // Tách đơn theo kho
  const byWarehouse = new Map();
  products.forEach((p) =>
    byWarehouse.set(p.warehouseId, [
      ...(byWarehouse.get(p.warehouseId) ?? []),
      p,
    ]),
  );
  const paymentDeadline = later(DEADLINE_MINUTES, "minute"); // ISO có "Z" như BE

  const created = [...byWarehouse.entries()].map(([warehouseId, list]) => {
    const subtotal = list.reduce((sum, p) => sum + p.currentPrice, 0);
    seq += 1;
    const order = {
      ...blank(),
      id: `od-${seq}`,
      orderNo: `OD-${dayjs().year()}-${String(seq).padStart(6, "0")}`,
      warehouseId,
      warehouseName: warehouseName(warehouseId),
      shippingAddressId,
      items: list.map((p) => ({
        productId: p.id,
        name: p.name,
        thumbnailUrl: p.photos[0]?.url ?? null,
        brandName: null, // màn chi tiết lấy thêm từ sản phẩm nếu cần
        size: p.size,
        condition: p.condition,
        price: p.currentPrice,
      })),
      productIds: list.map((p) => p.id),
      subtotal,
      shippingFee: SHIPPING_FEE,
      totalAmount: subtotal + SHIPPING_FEE,
      status: S.PENDING_PAYMENT,
      paymentDeadline,
      createdAt: now(),
    };
    setProductsStatus(order, PRODUCT_STATUS.RESERVED);
    return order;
  });
  orders.push(...created);
  if (buyNow)
    mockRemoveFromCart(ids); // BE 2bfc66c: đặt theo productIds cũng xoá các món đó khỏi giỏ
  else mockRemoveFromCart(ids);
  return created.map(toCreateResponse);
}

// ---------- Phase 4 ----------
export async function getOrders({ statuses = [], page = 0, size = 10 } = {}) {
  await delay();
  orders.forEach(expireIfLate);
  const list = orders
    .filter((o) => !statuses.length || statuses.includes(o.status))
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt)); // mới nhất trước
  return {
    content: list.slice(page * size, (page + 1) * size).map(toSummary),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
  };
}

export async function getOrder(id) {
  await delay(400);
  return toDetail(findOrder(id));
}

export async function getTracking(id) {
  await delay();
  const o = findOrder(id);
  return {
    status: o.status,
    ghnTrackingCode: o.ghnTrackingCode,
    expectedDeliveryDate: o.expectedDeliveryDate,
    hasIssue: o.hasIssue,
    issueNote: o.issueNote,
    events: [...o.trackingEvents].sort((a, b) =>
      dayjs(b.timestamp).diff(a.timestamp),
    ), // mới nhất trước
  };
}

export async function cancelOrder(id) {
  await delay();
  const o = findOrder(id);
  if (o.status !== S.PAID) {
    throw conflict(
      ERROR_CODES.CANNOT_CANCEL_AFTER_PACKING,
      "Kho đã bắt đầu đóng gói, không huỷ được nữa.",
    );
  }
  o.status = S.CANCELLED;
  o.cancelReason = "BUYER_CANCELLED";
  o.cancelledAt = now();
  o.refundAmount = o.totalAmount; // hoàn 100% gồm phí ship (ví mock nối ở nhánh feature/wallet)
  mockRefund({ orderId: o.id, orderNo: o.orderNo, amount: o.refundAmount }); // giao dịch REFUND vào ví
  setProductsStatus(o, PRODUCT_STATUS.ON_SALE);
  return { id: o.id, status: o.status };
}

export async function confirmReceipt(id) {
  await delay();
  const o = findOrder(id);
  if (o.status !== S.DELIVERED) {
    throw conflict(
      ERROR_CODES.ORDER_NOT_DELIVERED,
      "Đơn chưa ở trạng thái đã giao.",
    );
  }
  o.status = S.COMPLETED;
  o.completedAt = now();
  return { id: o.id, status: o.status };
}

export async function rateOrder(id, serviceRating) {
  await delay();
  const o = findOrder(id);
  if (
    !Number.isInteger(serviceRating) ||
    serviceRating < 1 ||
    serviceRating > 5
  ) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Số sao phải từ 1 đến 5.",
    });
  }
  if (o.status !== S.COMPLETED) {
    throw conflict("HTTP_409", "Chỉ đánh giá được đơn đã hoàn thành.");
  }
  o.serviceRating = serviceRating;
  o.ratedAt = now();
  return { id: o.id, serviceRating };
}

// ---------- [DEV] dùng trong khung Mock ----------

// paymentApi.mock gọi: MoMo báo thành công → PAID, món thành SOLD
export const mockMarkPaid = (orderIds) =>
  orders
    .filter((o) => orderIds.includes(o.id))
    .forEach((o) => {
      expireIfLate(o);
      if (o.status !== S.PENDING_PAYMENT) return;
      o.status = S.PAID;
      o.paidAt = now();
      o.paymentMethod = "MOMO";
      setProductsStatus(o, PRODUCT_STATUS.SOLD);
    });

// Rút ngắn hạn thanh toán còn 30 giây để test hết giờ
export const mockShortenDeadline = (orderIds) =>
  orders
    .filter((o) => orderIds.includes(o.id))
    .forEach((o) => {
      o.paymentDeadline = later(30, "second");
    });

// Giả lập kho / GHN đẩy đơn sang bước kế: PAID → PACKING → SHIPPING → DELIVERED → COMPLETED (hết hạn tự hoàn thành)
export async function mockAdvanceOrder(id) {
  await delay(300);
  const o = findOrder(id);
  if (o.status === S.PAID) o.status = S.PACKING;
  else if (o.status === S.PACKING) {
    o.status = S.SHIPPING;
    o.ghnTrackingCode = `GHN${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    o.expectedDeliveryDate = later(2, "day");
    o.trackingEvents = [ev("PICKED_UP", "GHN đã lấy hàng", o.warehouseName, 0)];
  } else if (o.status === S.SHIPPING) {
    o.status = S.DELIVERED;
    o.deliveredAt = now();
    o.autoCompleteDeadline = later(3, "day");
    o.hasIssue = false;
    o.trackingEvents.push(
      ev("DELIVERED", "Giao thành công", "Bưu cục gần bạn", 0),
    );
  } else if (o.status === S.DELIVERED) {
    o.status = S.COMPLETED;
    o.completedAt = now();
  }
  return toDetail(o);
}
