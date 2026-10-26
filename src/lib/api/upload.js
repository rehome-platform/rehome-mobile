// Upload 1 tệp (ảnh / PDF) → { url }. Dùng chung: tổ chức, ký gửi, ảnh đại diện, trả hàng…
// uploadFile(file = { uri, name, mimeType }, folder = UPLOAD_FOLDER.xxx)
import { MOCK } from "@/config/env";
import * as real from "./upload.real";
import * as mock from "./upload.mock";

export const uploadFile = MOCK.upload ? mock.uploadFile : real.uploadFile;
