// Màn hình CHỈ import file này
import * as mock from "./consignmentApi.mock";

// [CHỜ BE] API 14–24 chưa có → BE xong thì thêm consignmentApi.real.js cùng tên hàm,
// chọn theo MOCK.consignment (như authApi.js)
export const consignmentApi = mock;
