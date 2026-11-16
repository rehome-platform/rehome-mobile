// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./organizationApi.real";
import * as mock from "./organizationApi.mock";

export const organizationApi = MOCK.organization ? mock : real;
