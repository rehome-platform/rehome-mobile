// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./walletApi.real";
import * as mock from "./walletApi.mock";

export const walletApi = {
  ...(MOCK.wallet ? mock : real),
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockSetEmpty: mock.mockSetEmpty,
  mockIsEmpty: mock.mockIsEmpty,
  mockNextPayoutFails: mock.mockNextPayoutFails,
};
