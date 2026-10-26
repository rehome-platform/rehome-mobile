// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./returnsApi.real";
import * as mock from "./returnsApi.mock";

const impl = MOCK.returns ? mock : real; // API 79–82 (BE 51c2027)

export const returnsApi = {
  createReturn: impl.createReturn,
  getReturns: impl.getReturns,
  getReturn: impl.getReturn,
  confirmHandover: impl.confirmHandover,
  chooseInvalidReturn: impl.chooseInvalidReturn,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockReturnAction: mock.mockReturnAction,
  MOCK_RETURN_ACTIONS: mock.MOCK_RETURN_ACTIONS,
};
