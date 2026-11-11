import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { uploadFile } from "@/lib/api/upload";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { CAMPAIGN_STATUS as CS } from "@/constants/community";
import { ERROR_CODES } from "@/constants/errorCodes";
import { byCampaignOrder } from "../utils/campaignRules";

// Chiến dịch + quyên góp của tổ chức — API thật (BE 41f10c8). Cùng tên hàm và hình dạng dữ liệu với
// orgContentApi.mock.js. Chỗ lệch BE:
// - status BE trả ACTIVE / CLOSED → đổi về OPEN / CLOSED của app

// HIDDEN: Moderator ẩn do vi phạm (BE ee01f91) — chi tiết của chính tổ chức có hiddenReason
const STATUS_FROM_BE = {
  ACTIVE: CS.OPEN,
  OPEN: CS.OPEN,
  CLOSED: CS.CLOSED,
  HIDDEN: CS.HIDDEN,
};

// BE lưu loại đồ ưu tiên thành 1 chuỗi "A, B" → nhận cả mảng lẫn chuỗi
const toItemTypes = (v) =>
  Array.isArray(v)
    ? v
    : v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

const toCampaign = (c) => {
  const warehouses = c.warehouses ?? [];
  return {
    ...c,
    status: STATUS_FROM_BE[c.status] ?? c.status,
    preferredItemTypes: toItemTypes(c.preferredItemTypes),
    createdAt: c.createdAt ?? null,
    warehouseIds: warehouses.map((w) => w.id),
    warehouses,
  };
};

// 409 của BE có message kèm mã ("CAMPAIGN_LIMIT_REACHED: đã đạt…") → thay bằng câu dễ đọc, giữ nguyên mã
const FRIENDLY = {
  [ERROR_CODES.CAMPAIGN_LIMIT_REACHED]: () =>
    // Mức tối đa do Admin cấu hình, BE không trả con số → không ghi số cụ thể.
    // BE đếm cả chiến dịch bị ẩn do vi phạm mà chưa hết hạn
    "Tổ chức đã có đủ số chiến dịch tối đa (tính cả chiến dịch đang bị ẩn do vi phạm nhưng chưa hết hạn). Đóng bớt một chiến dịch hoặc chờ hết hạn rồi tạo mới.",
  [ERROR_CODES.CAMPAIGN_WAREHOUSE_HAS_PENDING]: (e) =>
    e.message
      .replace(/^[A-Z_]+:\s*/, "")
      .replace(/^./, (ch) => ch.toUpperCase()),
};
// 400 kho không hợp lệ không có mã riêng → nhận theo message, gắn mã mobile để màn hình tự bỏ kho cũ
const INVALID_WAREHOUSES = "warehouseIds không hợp lệ.";

async function friendly(promise) {
  try {
    return await promise;
  } catch (e) {
    if (e?.message === INVALID_WAREHOUSES)
      throw new ApiError({
        status: e.status,
        code: ERROR_CODES.CAMPAIGN_WAREHOUSE_INVALID,
        message:
          "Có địa điểm ký gửi bạn chọn không còn nhận đồ nên đã được bỏ khỏi danh sách. Kiểm tra lại nơi nhận rồi bấm lại.",
      });
    const rewrite = FRIENDLY[e.code];
    if (!rewrite) throw e;
    throw new ApiError({ status: e.status, code: e.code, message: rewrite(e) });
  }
}

// GET /api/organizations/me/campaigns — mọi trạng thái. Tổ chức có ít chiến dịch → lấy 1 trang lớn (BE tối đa 50)
export async function getMyCampaigns() {
  const page = unwrap(
    await api.get("/api/organizations/me/campaigns", { params: { size: 50 } }),
  );
  return (page.content ?? []).map(toCampaign).sort(byCampaignOrder);
}

// GET /campaigns/{id} (chi tiết công khai, cũng dùng cho chính tổ chức)
export async function getMyCampaign(id) {
  return toCampaign(unwrap(await api.get(`/campaigns/${id}`)));
}

// POST /campaigns → { id, status }. Đủ chiến dịch đang mở → 409 CAMPAIGN_LIMIT_REACHED
export async function createCampaign(body) {
  return friendly(api.post("/campaigns", body).then(unwrap));
}

// PUT /campaigns/{id} — field bỏ trống BE giữ nguyên. Bỏ kho còn lượt chờ lấy → 409 WAREHOUSE_HAS_PENDING_PICKUP
export async function updateCampaign(id, body) {
  const res = await friendly(api.put(`/campaigns/${id}`, body).then(unwrap));
  return toCampaign(res);
}

// Ảnh bìa trong máy → POST /uploads?folder=CAMPAIGN_COVERS → URL
export async function uploadCover(uri) {
  const res = await uploadFile(
    { uri, name: "cover.jpg", mimeType: "image/jpeg" },
    UPLOAD_FOLDER.CAMPAIGN_COVERS,
  );
  return res.url;
}

// POST /campaigns/{id}/close — đóng sớm → { id, status }
export async function closeCampaign(id) {
  const res = unwrap(await api.post(`/campaigns/${id}/close`));
  return { ...res, status: STATUS_FROM_BE[res?.status] ?? res?.status };
}

// GET /api/organizations/me/donations?campaignId&warehouseId — phân trang, mới nhất trước. Một kho một chiến dịch
// ít lượt → lấy 1 trang lớn (BE tối đa 50). Gồm cả lượt chờ lấy lẫn đã bàn giao
export async function getDonations({ campaignId, warehouseId }) {
  const page = unwrap(
    await api.get("/api/organizations/me/donations", {
      params: { campaignId, warehouseId, size: 50 },
    }),
  );
  return page?.content ?? [];
}

// GET /campaigns/{id}/donation-notes — note đã ghi, mới nhất trước (OC-08 xem lại). Chỉ tổ chức sở hữu;
// chiến dịch đã đóng vẫn đọc được. Số note (donationNoteCount) có sẵn trong GET /campaigns/{id} của chủ chiến dịch
export async function getDonationNotes(
  campaignId,
  { page = 0, size = 20 } = {},
) {
  return unwrap(
    await api.get(`/campaigns/${campaignId}/donation-notes`, {
      params: { page, size },
    }),
  );
}

// POST /campaigns/{id}/donation-notes (OC-08) — note nhận đồ tại địa chỉ riêng. Ẩn danh thì không gửi tên
export async function createDonationNote(
  campaignId,
  { donorName, isAnonymous, note },
) {
  return unwrap(
    await api.post(`/campaigns/${campaignId}/donation-notes`, {
      donorName: isAnonymous ? null : donorName.trim(),
      isAnonymous,
      note: note?.trim() || null,
    }),
  );
}
