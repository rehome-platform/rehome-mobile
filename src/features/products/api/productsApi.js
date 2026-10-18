// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./productsApi.real";
import * as mock from "./productsApi.mock";

export const productsApi = {
  getProducts: MOCK.products ? mock.getProducts : real.getProducts,
  getProduct: MOCK.productDetail ? mock.getProduct : real.getProduct, // [CHỜ BE] API 50
};
