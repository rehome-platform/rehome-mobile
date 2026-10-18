// Màn hình CHỈ import file này. [CHỜ BE] API 60/61 → BE xong thì thêm paymentApi.real.js
// (cài expo-web-browser + build lại dev build ở nhánh feature/payment-momo)
import * as mock from "./paymentApi.mock";

export const paymentApi = mock;
