import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { FILE_RULES } from "@/features/organization/constants";

const MAX_BYTES = FILE_RULES.maxSizeMB * 1024 * 1024;

// Một số máy không trả mimeType → đoán theo đuôi tệp
const guessMime = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  return "image/jpeg";
};
const normalizeMime = (mime, name) =>
  mime === "image/jpg" ? "image/jpeg" : (mime ?? guessMime(name));

// Kiểm định dạng + dung lượng ngay khi chọn. Sai → ném lỗi kèm câu báo cho người dùng
function checkFile(file) {
  if (!FILE_RULES.mimeTypes.includes(file.mimeType)) {
    throw new Error("Chỉ nhận ảnh JPG, PNG hoặc tệp PDF.");
  }
  if (file.size && file.size > MAX_BYTES) {
    throw new Error(
      `Tệp "${file.name}" lớn hơn ${FILE_RULES.maxSizeMB} MB. Hãy chụp lại hoặc nén tệp.`,
    );
  }
  return file;
}

const fromImageAsset = (a) => {
  const name = a.fileName ?? a.uri.split("/").pop();
  return checkFile({
    uri: a.uri,
    name,
    mimeType: normalizeMime(a.mimeType, name),
    size: a.fileSize ?? null,
  });
};

// Các hàm dưới: trả về tệp; người dùng huỷ → null; lỗi → ném Error
export async function takePhoto() {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    throw new Error(
      "ReHome cần quyền camera để chụp giấy tờ. Bật lại trong Cài đặt → Ứng dụng → Quyền.",
    );
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.7, // đủ nét để đọc chữ, nhẹ hơn ảnh gốc nhiều lần
  });
  return result.canceled ? null : fromImageAsset(result.assets[0]);
}

export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  return result.canceled ? null : fromImageAsset(result.assets[0]);
}

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: FILE_RULES.mimeTypes,
    copyToCacheDirectory: true, // copy vào cache app → uri còn dùng được lúc gửi hồ sơ
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return checkFile({
    uri: a.uri,
    name: a.name,
    mimeType: normalizeMime(a.mimeType, a.name),
    size: a.size ?? null,
  });
}

// 845000 → "825 KB"; 2400000 → "2.3 MB"
export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
