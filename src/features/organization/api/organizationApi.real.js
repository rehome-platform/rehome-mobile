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
// Hồ sơ của chính tổ chức đang đăng nhập (BE 51c2027). Chưa nộp → mọi field null (verificationStatus = null).
// Có: verificationStatus PENDING | REJECTED | VERIFIED, rejectionReason, thông tin tổ chức + điểm nhận.
// KHÔNG có người đại diện / giấy tờ. Response không bọc {result} — unwrap vẫn xử lý được
// Danh sách loại hình + phạm vi hoạt động cho form đăng ký (công khai) → [{ value, label }] như ChipGroup / RadioCard
export async function getOrgOptions() {
  const { orgTypes = [], operationScopes = [] } = unwrap(
    await api.get("/api/organizations/options"),
  );
  const toOption = ({ code, name }) => ({ value: code, label: name });
  return {
    orgTypes: orgTypes.map(toOption),
    operationScopes: operationScopes.map(toOption),
  };
}

export async function getMyOrganization() {
  return unwrap(await api.get("/api/organizations/me"));
}

// OP-02 — sửa thông tin thường, áp dụng ngay: { displayName, logoUrl, description, contactPhone,
// donationPointReceivingHours }. Ô trống BE giữ nguyên giá trị cũ
export async function updateMyProfile(body) {
  return unwrap(await api.patch("/api/organizations/me", body));
}

// OP-04 — gửi yêu cầu đổi pháp lý (chờ Moderator duyệt). proposedChanges = JSON tự do (đã gửi BE hình dạng):
// { legalName?, orgType?, representative?: {...}, documents?: [{ docType, docNumber, issueDate, issuingAuthority, fileUrl }] }
// OP-05 · GET /me/legal-change-requests/latest → { id, status, proposedChanges, rejectReason, createdAt, decidedAt }.
// decidedAt → reviewedAt (tên màn OP-05 đang dùng). Chưa từng gửi yêu cầu → BE 404 → null
export async function getLatestLegalChange() {
  try {
    const r = unwrap(
      await api.get("/api/organizations/me/legal-change-requests/latest"),
    );
    return r ? { ...r, reviewedAt: r.decidedAt ?? null } : null;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function requestLegalChange(proposedChanges) {
  return unwrap(
    await api.post("/api/organizations/me/legal-change-requests", {
      proposedChanges,
    }),
  ); // { id, status }
}
