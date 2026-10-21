// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./degradedApi.real";
import * as mock from "./degradedApi.mock";

const impl = MOCK.withdrawals ? mock : real; // [CHỜ BE] API 94–95

export const degradedApi = {
  getDegradedCase: impl.getDegradedCase,
  getMyDegradedCases: impl.getMyDegradedCases,
  decideDegradedCase: impl.decideDegradedCase,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockExpireDecision: mock.mockExpireDecision,
};
