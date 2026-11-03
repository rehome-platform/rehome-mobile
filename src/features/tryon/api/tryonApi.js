// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./tryonApi.real";
import * as mock from "./tryonApi.mock";

const impl = MOCK.tryon ? mock : real; // API 97–99 thật; 96 tạm thay (xem tryonApi.real.js)

export const tryonApi = {
  getSuggestions: impl.getSuggestions,
  getSlotProducts: impl.getSlotProducts,
  createTryonImage: impl.createTryonImage,
  getTryonImages: impl.getTryonImages,
  getTryonImage: impl.getTryonImage,
  deleteTryonImage: impl.deleteTryonImage,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockFailNextTryon: mock.mockFailNextTryon,
};
