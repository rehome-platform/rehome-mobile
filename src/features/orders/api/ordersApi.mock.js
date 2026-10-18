// Mock API 59 + 63, làm GIỐNG BE (OrderServiceImpl): tách đơn theo kho, phí ship 25.000/đơn, giữ hàng 15 phút,
// 1 món không còn bán → 409 cả lần. Dùng chung dữ liệu với productsApi.mock và cartApi.mock
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { ORDER_STATUS } from "@/constants/order";
import { mockFindProduct } from "@/features/products/api/productsApi.mock";
import {
  mockCartProductIds,
  mockRemoveFromCart,
} from "@/features/cart/api/cartApi.mock";

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));
const SHIPPING_FEE = 25000; // giống cấu hình BE app.order.shipping-fee
const DEADLINE_MINUTES = 15;

let orders = [];
let seq = 0;
let failNext = false;

// [DEV] Lần đặt kế tiếp: món đầu tiên "vừa bị người khác mua" → 409 (test trạng thái Giữ hàng thất bại)
export const mockFailNextOrder = () => {
  failNext = true;
};

const toResponse = (o) => ({
  id: o.id,
  orderNo: o.orderNo,
  warehouseId: o.warehouseId,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  totalAmount: o.totalAmount,
  status: o.status,
  paymentDeadline: o.paymentDeadline,
});

const setProductsStatus = (o, status) =>
  o.productIds.forEach((id) => {
    const p = mockFindProduct(id);
    if (p) p.status = status;
  });

// Quá hạn mà chưa trả → huỷ, nhả hàng (BE sẽ có job làm việc này)
const expireIfLate = (o) => {
  if (
    o.status === ORDER_STATUS.PENDING_PAYMENT &&
    dayjs().isAfter(o.paymentDeadline)
  ) {
    o.status = ORDER_STATUS.CANCELLED;
    setProductsStatus(o, PRODUCT_STATUS.ON_SALE);
  }
};

export async function createOrders({ shippingAddressId, productIds }) {
  await delay();
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
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Sản phẩm không còn để bán.",
    });
  }

  // Tách đơn theo kho
  const byWarehouse = new Map();
  products.forEach((p) =>
    byWarehouse.set(p.warehouseId, [
      ...(byWarehouse.get(p.warehouseId) ?? []),
      p,
    ]),
  );
  const paymentDeadline = dayjs().add(DEADLINE_MINUTES, "minute").toISOString(); // ISO có "Z" như BE

  const created = [...byWarehouse.entries()].map(([warehouseId, list]) => {
    const subtotal = list.reduce((sum, p) => sum + p.currentPrice, 0);
    seq += 1;
    const order = {
      id: `od-${seq}`,
      orderNo: `OD-${dayjs().year()}-${String(seq).padStart(6, "0")}`,
      warehouseId,
      subtotal,
      shippingFee: SHIPPING_FEE,
      totalAmount: subtotal + SHIPPING_FEE,
      status: ORDER_STATUS.PENDING_PAYMENT,
      paymentDeadline,
      productIds: list.map((p) => p.id),
    };
    setProductsStatus(order, PRODUCT_STATUS.RESERVED);
    return order;
  });
  orders.push(...created);
  if (!buyNow) mockRemoveFromCart(ids); // như BE: chỉ nhánh "cả giỏ" mới xoá khỏi giỏ
  return created.map(toResponse);
}

export async function getOrder(id) {
  await delay(400);
  const o = orders.find((x) => x.id === id);
  if (!o)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy đơn hàng.",
    });
  expireIfLate(o);
  return { ...toResponse(o), productIds: o.productIds };
}

// [DEV] paymentApi.mock gọi: MoMo báo thành công → PAID, món thành SOLD
export const mockMarkPaid = (orderIds) =>
  orders
    .filter((o) => orderIds.includes(o.id))
    .forEach((o) => {
      expireIfLate(o);
      if (o.status !== ORDER_STATUS.PENDING_PAYMENT) return;
      o.status = ORDER_STATUS.PAID;
      setProductsStatus(o, PRODUCT_STATUS.SOLD);
    });

// [DEV] Rút ngắn hạn thanh toán còn 30 giây để test hết giờ
export const mockShortenDeadline = (orderIds) =>
  orders
    .filter((o) => orderIds.includes(o.id))
    .forEach((o) => {
      o.paymentDeadline = dayjs().add(30, "second").toISOString();
    });
