// Màn hình CHỈ import file này. Cờ riêng với chiến dịch: chiến dịch đã thật, bài viết còn mock [CHỜ BE].
// Mock bài viết gắn với chiến dịch mock (oc-1…) → ô "Gắn chiến dịch" ở form bài lấy danh sách chiến dịch thật
import { MOCK } from "@/config/env";
import * as real from "./orgPostApi.real";
import * as mock from "./orgPostApi.mock";

export const orgPostApi = MOCK.orgPosts ? mock : real;
