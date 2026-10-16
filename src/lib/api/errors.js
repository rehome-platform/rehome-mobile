// Mọi lỗi (axios, mock, mất mạng) đều được đổi về MỘT kiểu: ApiError
export class ApiError extends Error {
  constructor({
    status = 0,
    code = "UNKNOWN",
    message,
    fieldErrors = {},
    reason = null,
  }) {
    super(message);
    this.status = status; // 0 = lỗi mạng / timeout
    this.code = code; // data.code của BE, hoặc "HTTP_<status>" khi BE chưa có code
    this.fieldErrors = fieldErrors; // { email: '…' } — BE hiện chưa trả, luôn rỗng
    this.reason = reason; // lý do khoá tài khoản (ACCOUNT_BANNED) — [CHỜ BE]
  }
}

const DEFAULT_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

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
  return new ApiError({
    status,
    code: body.code ?? "HTTP_" + status,
    message: body.message || DEFAULT_MESSAGE, // BE có 2 dạng lỗi, cả hai đều có message
    fieldErrors: body.fieldErrors ?? {},
    reason: body.reason ?? null,
  });
}
