import { api, unwrap } from "@/lib/api/client";

// Đọc code BE 2af9d85 (19/10). Cần token tài khoản ORGANIZATION; hồ sơ gắn vào account đang đăng nhập.
// Lỗi có code: 409 ORGANIZATION_PROFILE_ALREADY_EXISTS / ORGANIZATION_EMAIL_TAKEN / ORGANIZATION_TAX_CODE_TAKEN
export async function registerOrganization(payload) {
  return unwrap(
    await api.post("/api/organizations/register/organization", payload),
  ); // {accountId, verificationStatus}
}

// Nộp lại khi bị từ chối. 403 ORGANIZATION_NOT_REJECTED · 404 ORGANIZATION_PROFILE_NOT_FOUND
export async function resubmitRegistration(payload) {
  return unwrap(await api.put("/api/organizations/me/registration", payload)); // {verificationStatus}
}
