// Màn hình CHỈ import file này. BE đã đủ CRUD (18/10) → chỉ có bản thật, như profileApi
import * as real from "./addressApi.real";

export const addressApi = { ...real };
