// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./withdrawalApi.real";
import * as mock from "./withdrawalApi.mock";

const impl = MOCK.withdrawals ? mock : real; // [CHỜ BE] API 90–92

export const withdrawalApi = {
  createWithdrawal: impl.createWithdrawal,
  payWithdrawalFee: impl.payWithdrawalFee,
  getWithdrawal: impl.getWithdrawal,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockMomoResult: mock.mockMomoResult,
  mockWithdrawalAction: mock.mockWithdrawalAction,
  MOCK_WITHDRAWAL_ACTIONS: mock.MOCK_WITHDRAWAL_ACTIONS,
};
