// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./ordersApi.real";
import * as mock from "./ordersApi.mock";

const manage = MOCK.orderList ? mock : real; // [CHỜ BE] API 62–67

export const ordersApi = {
  createOrders: MOCK.orders ? mock.createOrders : real.createOrders, // API 59
  getOrders: manage.getOrders,
  getOrder: manage.getOrder,
  getTracking: manage.getTracking,
  cancelOrder: manage.cancelOrder,
  confirmReceipt: manage.confirmReceipt,
  rateOrder: manage.rateOrder,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockFailNextOrder: mock.mockFailNextOrder,
  mockShortenDeadline: mock.mockShortenDeadline,
  mockAdvanceOrder: mock.mockAdvanceOrder,
  mockExpireReturnWindow: mock.mockExpireReturnWindow,
};
