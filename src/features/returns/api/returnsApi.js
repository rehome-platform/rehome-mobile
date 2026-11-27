// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import { INVALID_RETURN_CHOICE } from "@/constants/returns";
import * as real from "./returnsApi.real";
import * as mock from "./returnsApi.mock";
import * as ship from "./shipBackApi.real";

const impl = MOCK.returns ? mock : real; // API 79–82 (BE 51c2027)

export const returnsApi = {
  createReturn: impl.createReturn,
  getReturns: impl.getReturns,
  getReturn: impl.getReturn,
  confirmHandover: impl.confirmHandover,
  // Đến địa điểm lấy: API 82 như cũ. Gửi lại (đặc tả 27/11, [CHỜ BE]): opts = { ret, address }
  chooseInvalidReturn: (id, choice, opts) =>
    choice === INVALID_RETURN_CHOICE.SHIP_BACK
      ? ship.chooseShipBack(opts)
      : impl.chooseInvalidReturn(id, choice),
  getShipBackQuote: ship.getShipBackQuote, // ({ ret, address }) → { fee }
  payShipBack: ship.payShipBack, // ({ ret, method }) → { paid, payUrl }
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockReturnAction: mock.mockReturnAction,
  MOCK_RETURN_ACTIONS: mock.MOCK_RETURN_ACTIONS,
};
