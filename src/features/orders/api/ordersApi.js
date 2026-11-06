// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./ordersApi.real";
import * as mock from "./ordersApi.mock";

const manage = MOCK.orderList ? mock : real; // API 62–67 thật

export const ordersApi = {
  createOrders: MOCK.orders ? mock.createOrders : real.createOrders, // API 59
  getOrders: manage.getOrders,
  getOrder: manage.getOrder,
  getTracking: manage.getTracking,
  cancelOrder: manage.cancelOrder,
  changeShippingAddress: manage.changeShippingAddress, // hướng A — PATCH /orders/{id}/shipping-address (BE #212)
  confirmReceipt: manage.confirmReceipt,
  rateOrder: manage.rateOrder,
  getSoldOrders: manage.getSoldOrders, // đơn có món mình ký gửi
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockFailNextOrder: mock.mockFailNextOrder,
  mockShortenDeadline: mock.mockShortenDeadline,
  mockAdvanceOrder: mock.mockAdvanceOrder,
  mockExpireReturnWindow: mock.mockExpireReturnWindow,
};
