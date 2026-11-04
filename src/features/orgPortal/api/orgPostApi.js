// Màn hình CHỈ import file này. Cờ riêng với chiến dịch (MOCK.orgPosts).
// Lưu ý: bật mock bài viết khi chiến dịch đang thật → bài mock gắn chiến dịch mock (oc-1…), không khớp danh sách thật
import { MOCK } from "@/config/env";
import * as real from "./orgPostApi.real";
import * as mock from "./orgPostApi.mock";

export const orgPostApi = MOCK.orgPosts ? mock : real;
