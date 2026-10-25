// Màn hình CHỈ import file này. Danh mục/thương hiệu dùng chung: ký gửi (Phase 2), sàn mua (Phase 3)
import { MOCK } from "@/config/env";
import * as real from "./catalogApi.real";
import * as mock from "./catalogApi.mock";

export const catalogApi = MOCK.catalog ? mock : real;
