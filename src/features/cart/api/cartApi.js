// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./cartApi.real";
import * as mock from "./cartApi.mock";

export const cartApi = MOCK.cart ? mock : real;
