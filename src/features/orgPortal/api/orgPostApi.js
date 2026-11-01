// Màn hình CHỈ import file này. Cùng cờ với chiến dịch: bài viết gắn với chiến dịch mock
import { MOCK } from "@/config/env";
import * as real from "./orgPostApi.real";
import * as mock from "./orgPostApi.mock";

export const orgPostApi = MOCK.orgContent ? mock : real;
