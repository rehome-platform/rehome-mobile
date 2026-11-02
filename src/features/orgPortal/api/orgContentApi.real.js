import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { uploadFile } from "@/lib/api/upload";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { CAMPAIGN_STATUS as CS, ORG_LIMITS } from "@/constants/community";
import { ERROR_CODES } from "@/constants/errorCodes";
import { byCampaignOrder } from "../utils/campaignRules";

// Chiến dịch + quyên góp của tổ chức — API thật (BE 2c9533b). Cùng tên hàm và hình dạng dữ liệu với
// orgContentApi.mock.js. Chỗ lệch BE (đã báo):
// - status BE trả ACTIVE / CLOSED → đổi về OPEN / CLOSED của app
// - [CHỜ BE] response chưa có preferredItemTypes, createdAt → [] / null
// - lượt chờ lấy là "kho chung" (mọi tổ chức thấy) → app lọc theo chiến dịch + kho

const STATUS_FROM_BE = { ACTIVE: CS.OPEN, OPEN: CS.OPEN, CLOSED: CS.CLOSED };

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
    `Tổ chức đang có ${ORG_LIMITS.MAX_OPEN_CAMPAIGNS} chiến dịch đang nhận đồ. Đóng bớt một chiến dịch rồi tạo mới.`,
  [ERROR_CODES.CAMPAIGN_WAREHOUSE_HAS_PENDING]: (e) =>
    e.message
      .replace(/^[A-Z_]+:\s*/, "")
      .replace(/^./, (ch) => ch.toUpperCase()),
};
async function friendly(promise) {
  try {
    return await promise;
  } catch (e) {
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

// PUT /campaigns/{id} — field bỏ trống BE giữ nguyên. Bỏ kho còn lượt chờ lấy → 409 WAREHOUSE_HAS_PENDING_PICKUP.
// [CHỜ BE] BE chưa trả preferredItemTypes nên form sửa luôn trống mục này → không gửi khi trống, tránh xoá mất
export async function updateCampaign(id, body) {
  const { preferredItemTypes, ...rest } = body;
  const payload = preferredItemTypes?.length
    ? { ...rest, preferredItemTypes }
    : rest;
  const res = await friendly(api.put(`/campaigns/${id}`, payload).then(unwrap));
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

// GET /api/organizations/me/donations — lượt chờ lấy (mọi kho) + lượt tổ chức đã nhận → lọc đúng chiến dịch + kho.
// Mới nhất trước (BE đã xếp)
export async function getDonations({ campaignId, warehouseId }) {
  const list = unwrap(await api.get("/api/organizations/me/donations")) ?? [];
  return list.filter(
    (d) => d.campaignId === campaignId && d.warehouseId === warehouseId,
  );
}

// POST /api/organizations/me/donation-notes — note nhận đồ tại địa chỉ riêng. Ẩn danh thì không gửi tên
export async function createDonationNote(
  campaignId,
  { donorName, isAnonymous, note },
) {
  return unwrap(
    await api.post("/api/organizations/me/donation-notes", {
      campaignId,
      donorName: isAnonymous ? null : donorName.trim(),
      isAnonymous,
      note: note?.trim() || null,
    }),
  );
}
