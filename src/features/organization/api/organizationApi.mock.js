// Mock API tổ chức, cùng tên hàm + hình dạng với organizationApi.real (BE 2af9d85)
// Giả lập lỗi để test: email liên hệ chứa "used" → trùng email; MST 0000000000 → trùng MST;
// tên hiển thị chứa "dupe" → tài khoản đã nộp hồ sơ
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const conflict = (code, message) =>
  new ApiError({ status: 409, code, message });

export async function registerOrganization(payload) {
  await delay(1200);
  if (payload.contactEmail.includes("used")) {
    throw conflict(
      ERROR_CODES.ORGANIZATION_EMAIL_TAKEN,
      "Email liên hệ đã được sử dụng.",
    );
  }
  if (payload.taxCode === "0000000000") {
    throw conflict(
      ERROR_CODES.ORGANIZATION_TAX_CODE_TAKEN,
      "Mã số thuế đã được sử dụng.",
    );
  }
  if (payload.displayName.toLowerCase().includes("dupe")) {
    throw conflict(
      ERROR_CODES.ORGANIZATION_PROFILE_ALREADY_EXISTS,
      "Tài khoản này đã có hồ sơ tổ chức.",
    );
  }
  return { accountId: "mock-account", verificationStatus: "PENDING" };
}

export async function resubmitRegistration() {
  await delay(1200);
  return { verificationStatus: "PENDING" };
}
export async function getMyOrganization() {
  await delay(400);
  return { verificationStatus: null }; // mock: luôn "chưa nộp"
}
