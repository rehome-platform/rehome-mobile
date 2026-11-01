// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./orgContentApi.real";
import * as mock from "./orgContentApi.mock";

export const orgContentApi = MOCK.orgContent ? mock : real;
