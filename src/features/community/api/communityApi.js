// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./communityApi.real";
import * as mock from "./communityApi.mock";

export const communityApi = MOCK.community ? mock : real; // API 100–109 thật (BE edff4ae)
