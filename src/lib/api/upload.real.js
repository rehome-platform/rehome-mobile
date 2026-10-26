import { api, unwrap } from "./client";

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

// BE kiểm nội dung thật của tệp: khai sai loại (PNG mà gửi image/jpeg) → 400 FILE_CONTENT_MISMATCH
// → ưu tiên đoán theo đuôi tệp trong máy, không có đuôi mới dùng mimeType truyền vào
const mimeOf = (file) =>
  MIME_BY_EXT[file.uri.split("?")[0].split(".").pop()?.toLowerCase()] ??
  file.mimeType ??
  "image/jpeg";

// POST /uploads (multipart: file + ?folder=UPLOAD_FOLDER). Trả {url, originalFileName, contentType, sizeBytes}
// Lỗi: 413 FILE_TOO_LARGE · 400 FILE_TYPE_NOT_ALLOWED / FILE_CONTENT_MISMATCH / INVALID_UPLOAD_FOLDER
export async function uploadFile(file, folder) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? "file",
    type: mimeOf(file),
  });
  return unwrap(
    await api.post("/uploads", form, {
      params: { folder },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // ảnh lớn + Render chậm
    }),
  );
}
