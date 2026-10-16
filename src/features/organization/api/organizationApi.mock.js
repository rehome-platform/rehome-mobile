// Mock cho phần BE chưa có: upload tệp, đăng ký tổ chức kèm mật khẩu [CHỜ BE]
// Cùng tên hàm + hình dạng dữ liệu với bản thật sau này
import { ApiError } from "@/lib/api/errors";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// [CHỜ BE POST /uploads] trả url giả
export async function uploadFile(file) {
  await delay(300);
  return { url: `https://mock.rehome.vn/uploads/${Date.now()}-${file.name}` };
}

// Giả lập lỗi trùng của BE (409, đúng câu BE trả) để test nhánh lỗi:
// email chứa "used" → trùng email; MST 0000000000 → trùng MST
export async function registerOrganization(payload) {
  await delay(1200);
  if (payload.contactEmail.includes("used")) {
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Email đã được sử dụng!!",
    });
  }
  if (payload.taxCode === "0000000000") {
    throw new ApiError({
      status: 409,
      code: "HTTP_409",
      message: "Mã số thuế đã được sử dụng!!",
    });
  }
  return {
    displayName: payload.displayName,
    contactEmail: payload.contactEmail,
    verificationStatus: "PENDING",
    submittedAt: new Date().toISOString(),
  };
}
