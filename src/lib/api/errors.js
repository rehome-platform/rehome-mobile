// Mọi lỗi (axios, mock, mất mạng) đều được đổi về MỘT kiểu: ApiError
export class ApiError extends Error {
  constructor({
    status = 0,
    code = "UNKNOWN",
    message,
    fieldErrors = {},
    reason = null,
    detail = null,
  }) {
    super(message);
    this.status = status; // 0 = lỗi mạng / timeout
    this.code = code; // data.code của BE, hoặc "HTTP_<status>" khi BE chưa có code
    this.fieldErrors = fieldErrors; // { email: '…' } — BE hiện chưa trả, luôn rỗng
    this.reason = reason; // lý do khoá tài khoản (ACCOUNT_BANNED) — [CHỜ BE]
    this.detail = detail; // câu lỗi gốc của BE khi bị thay bằng câu dễ hiểu (5xx) — chỉ để dev xem
  }
}

const DEFAULT_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";
// 5xx (trừ 503) = lỗi phía máy chủ: message của BE thường là lỗi kỹ thuật (SQL, stack…) → KHÔNG đưa lên màn hình
const SERVER_MESSAGE = "Máy chủ đang gặp sự cố, bạn thử lại sau ít phút nhé.";

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (!error?.response) {
    return new ApiError({
      status: 0,
      code: "NETWORK",
      message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    });
  }
  const { status, data } = error.response;
  const body = data && typeof data === "object" ? data : {}; // 403 thiếu token: body rỗng
  // 503: BE dùng cho lỗi có câu dành cho người dùng (vd. không gửi được email đăng ký) → giữ message của BE
  const serverError = status >= 500 && status !== 503;
  if (serverError && __DEV__)
    console.warn(`[API ${status}] ${error.config?.url}:`, body.message);
  return new ApiError({
    status,
    code: body.code ?? "HTTP_" + status,
    // BE có 2 dạng lỗi, cả hai đều có message; riêng 5xx thay bằng câu dễ hiểu
    message: serverError ? SERVER_MESSAGE : body.message || DEFAULT_MESSAGE,
    fieldErrors: body.fieldErrors ?? {},
    reason: body.reason ?? null,
    detail: serverError ? (body.message ?? null) : null,
  });
}
