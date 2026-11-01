// Màn hình CHỈ import file này. API công khai đã có → chỉ có bản thật, như addressApi
import * as real from "./warehouseApi.real";

export const warehouseApi = { ...real };
