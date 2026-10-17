// Upload 1 tệp (ảnh / PDF) → { url }. Dùng chung cho mọi nghiệp vụ: tổ chức, ký gửi, ảnh đại diện.
// file = { uri, name, mimeType }
// [CHỜ BE] chưa có bản thật → BE có POST /uploads thì thêm upload.real.js cùng tên hàm, chọn theo MOCK.upload
import * as mock from "./upload.mock";

export const uploadFile = mock.uploadFile;
