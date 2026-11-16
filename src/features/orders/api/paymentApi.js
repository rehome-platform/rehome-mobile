// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./paymentApi.real";
import * as mock from "./paymentApi.mock";

export const paymentApi = MOCK.payment ? mock : real;
