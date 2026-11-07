import { ENV } from "@/config/env";

// Expo Go KHÔNG có module native của Google → chỉ nạp khi chạy bản dev build / APK.
// Nhờ vậy app vẫn mở được bằng Expo Go (nút Google chỉ báo "cần bản cài đặt").
// Dùng try/catch thay vì chỉ dựa vào Constants.executionEnvironment: giá trị "storeClient"
// gộp cả Expo Go và dev build nên không chắc luôn phân biệt đúng; module không có thì rơi về null.
let Google = null;
try {
  Google = require("@react-native-google-signin/google-signin");
} catch {
  Google = null;
}

export const GOOGLE_AVAILABLE = Google !== null;

let configured = false;
function ensureConfigured() {
  if (configured) return;
  // webClientId = client ID BE dùng để kiểm idToken (audience) — phải đúng giá trị đó
  Google.GoogleSignin.configure({ webClientId: ENV.GOOGLE_WEB_CLIENT_ID });
  configured = true;
}

// Mở hộp chọn tài khoản Google → trả idToken. Người dùng huỷ → null. Lỗi → ném Error có message tiếng Việt
export async function getGoogleIdToken() {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } =
    Google;
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut().catch(() => {}); // lần nào cũng cho chọn tài khoản (không tự lấy tài khoản cũ)
    const res = await GoogleSignin.signIn();
    return isSuccessResponse(res) ? res.data.idToken : null; // không success = người dùng bấm huỷ
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null; // bấm 2 lần
    if (
      isErrorWithCode(e) &&
      e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
    ) {
      throw new Error(
        "Máy chưa có Google Play Services, không đăng nhập Google được.",
      );
    }
    throw new Error("Không đăng nhập được bằng Google. Vui lòng thử lại.");
  }
}
