// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./ordersApi.real";
import * as mock from "./ordersApi.mock";

export const ordersApi = {
  createOrders: MOCK.orders ? mock.createOrders : real.createOrders,
  getOrder: MOCK.payment ? mock.getOrder : real.getOrder, // [CHỜ BE] API 63
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockFailNextOrder: mock.mockFailNextOrder,
  mockShortenDeadline: mock.mockShortenDeadline,
};
