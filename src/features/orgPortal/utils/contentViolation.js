import { Alert } from "react-native";
import { ERROR_CODES } from "@/constants/errorCodes";

// Từ ngữ vi phạm khi tổ chức đăng / sửa bài viết, chiến dịch (BE ContentModerationService: từ mức AUTO_REJECT
// → không lưu, 400 CONTENT_VIOLATION). BE cố ý KHÔNG trả từ / ô bị chặn (tránh lộ danh sách từ cấm) →
// tô đỏ mọi ô chữ BE có kiểm tra + bật hộp thoại (khung lỗi đầu form dễ bị trôi khỏi màn khi đang cuộn ở nút Đăng).
// Giữ nguyên nội dung đã nhập để sửa rồi đăng lại. Sửa ô nào thì dòng nhắc ô đó tự mất (react-hook-form kiểm lại)
export const isContentViolation = (e) =>
  e?.code === ERROR_CODES.CONTENT_VIOLATION;

const FIELD_HINT = "Có thể chứa từ ngữ không phù hợp, vui lòng sửa lại";

// fields: tên ô trong form (chiến dịch: title, description · bài viết: content). Trả true nếu đã xử lý
export function handleContentViolation(e, setError, fields) {
  if (!isContentViolation(e)) return false;
  fields.forEach((name, i) =>
    setError(
      name,
      { type: "server", message: FIELD_HINT },
      { shouldFocus: i === 0 },
    ),
  );
  Alert.alert(
    "Chưa đăng được",
    "Nội dung có từ ngữ không phù hợp. Vui lòng sửa lại các ô được tô đỏ rồi đăng lại.",
  );
  return true;
}
