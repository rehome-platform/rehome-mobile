// Mock app tổ chức (chiến dịch kiểu mới, đơn chờ lấy, note quyên góp) "sống" trong RAM — reload app là về dữ liệu mẫu.
// Hình dạng theo danh sách đã gửi BE (PHASE7 mục 5):
//   campaign = { id, title, coverUrl, description, startTime, endTime, preferredItemTypes, status, createdAt,
//                receiveAtOwnAddress, warehouseIds, warehouses: [{ id, name, address, openingHours, pendingCount }] }
//   donation = { id, campaignId, warehouseId, warehouseName, donorName, isAnonymous, note, status, createdAt,
//                recordedBy, handedOverAt }
// Kho lấy từ GET /warehouses THẬT (công khai) → id khớp với WarehousePicker
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { CAMPAIGN_STATUS as CS, ORG_LIMITS } from "@/constants/community";
import { DONATION_STATUS as DS } from "@/constants/donation";
import { ERROR_CODES } from "@/constants/errorCodes";
import { warehouseApi } from "@/features/warehouses/api/warehouseApi";
import { byCampaignOrder } from "../utils/campaignRules";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const photo = (seed) => `https://picsum.photos/seed/${seed}/800/450`;
const notFound = () =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: "Không tìm thấy chiến dịch.",
  });

let warehouses = [];
let campaigns = null; // null = chưa tạo dữ liệu mẫu
let donations = [];
let notes = []; // OC-08: chưa có API đọc lại [CHỜ LEAD L3]
let nextId = 100;

const campaign = (
  id,
  title,
  description,
  startDays,
  endDays,
  status,
  types,
  receiving,
) => ({
  id,
  title,
  coverUrl: photo(id),
  description,
  startTime: ago(startDays, "day"),
  endTime: endDays >= 0 ? later(endDays, "day") : ago(-endDays, "day"),
  preferredItemTypes: types,
  status,
  createdAt: ago(startDays, "day"),
  ...receiving,
});

const donation = (
  id,
  campaignId,
  warehouseId,
  donorName,
  note,
  hoursAgo,
  handedOverDaysAgo,
) => ({
  id,
  campaignId,
  warehouseId,
  donorName,
  isAnonymous: donorName == null,
  note,
  status: handedOverDaysAgo == null ? DS.PENDING_PICKUP : DS.HANDED_OVER,
  createdAt: ago(hoursAgo, "hour"),
  recordedBy: "MOD-07-003",
  handedOverAt:
    handedOverDaysAgo == null ? null : ago(handedOverDaysAgo, "day"),
});

// Lần gọi đầu: lấy kho thật rồi dựng dữ liệu mẫu gắn vào 1–2 kho đầu tiên
async function seed() {
  if (campaigns) return;
  warehouses = await warehouseApi.getWarehouses().catch(() => []);
  const [w1, w2] = warehouses;
  const ids = (...list) => list.filter(Boolean).map((w) => w.id);
  campaigns = [
    campaign(
      "oc-1",
      "Áo ấm cho trẻ vùng cao mùa đông 2026",
      "Mùa đông năm nay ở Hà Giang xuống dưới 5 độ. Quỹ gom áo ấm và chăn cho 4 điểm trường tiểu học, khoảng 600 em.",
      10,
      50,
      CS.OPEN,
      ["Áo khoác", "Áo len", "Khăn, mũ", "Đồ trẻ em 3–12 tuổi"],
      { receiveAtOwnAddress: true, warehouseIds: ids(w1, w2) },
    ),
    campaign(
      "oc-2",
      "Quần áo đi học cho trẻ mồ côi",
      "Chuẩn bị học kỳ mới cho 120 em ở các mái ấm đối tác: quần áo đồng phục, áo khoác mỏng, giày dép.",
      5,
      70,
      CS.OPEN,
      ["Quần dài", "Giày dép", "Đồ dùng học tập"],
      { receiveAtOwnAddress: false, warehouseIds: ids(w1) },
    ),
    campaign(
      "oc-3",
      "Hỗ trợ bà con vùng lũ miền Trung",
      "Đã khép lại sau 3 tuần. Cảm ơn hơn 400 người đã mang đồ tới.",
      60,
      -20,
      CS.CLOSED,
      ["Chăn, màn", "Quần dài"],
      { receiveAtOwnAddress: true, warehouseIds: ids(w2) },
    ),
    campaign(
      "oc-4",
      "Tủ đồ cho chuyến tình nguyện hè",
      "Gom đồ cho đoàn tình nguyện mùa hè tại Sóc Trăng.",
      120,
      -60,
      CS.CLOSED,
      ["Áo khoác", "Giày dép"],
      { receiveAtOwnAddress: true, warehouseIds: [] },
    ),
  ];
  if (w1) {
    donations = [
      donation(
        "dn-1",
        "oc-1",
        w1.id,
        "Trần Thị B",
        "2 áo khoác len và 1 chăn mỏng, còn mới, đã giặt sạch.",
        20,
      ),
      donation(
        "dn-2",
        "oc-1",
        w1.id,
        null,
        "Một túi quần áo trẻ em, gửi lại quầy, không để tên.",
        45,
      ),
      donation(
        "dn-3",
        "oc-1",
        w1.id,
        "Ngô Hải F",
        "Áo khoác dạ, size M.",
        70,
        1,
      ),
      donation("dn-4", "oc-2", w1.id, "Lê Văn C", "3 bộ đồng phục cấp 1.", 6),
    ];
  }
}

const warehouseName = (id) => warehouses.find((w) => w.id === id)?.name ?? "";
const pendingCountOf = (campaignId, warehouseId) =>
  donations.filter(
    (d) =>
      d.campaignId === campaignId &&
      d.warehouseId === warehouseId &&
      d.status === DS.PENDING_PICKUP,
  ).length;

const campaignView = (c) => ({
  ...c,
  preferredItemTypes: [...c.preferredItemTypes],
  warehouseIds: [...c.warehouseIds],
  warehouses: c.warehouseIds.map((id) => {
    const w = warehouses.find((x) => x.id === id) ?? {
      id,
      name: "",
      address: "",
    };
    return {
      id,
      name: w.name,
      address: w.address,
      openingHours: w.openingHours ?? null,
      pendingCount: pendingCountOf(c.id, id),
    };
  }),
});

const findCampaign = (id) => {
  const c = campaigns.find((x) => x.id === id);
  if (!c) throw notFound();
  return c;
};

// GET /api/organizations/me/campaigns
export async function getMyCampaigns() {
  await seed();
  await delay();
  return [...campaigns].sort(byCampaignOrder).map(campaignView);
}

// GET /campaigns/{id}
export async function getMyCampaign(id) {
  await seed();
  await delay(300);
  return campaignView(findCampaign(id));
}

// POST /campaigns — đủ chiến dịch đang mở → 409
export async function createCampaign(body) {
  await seed();
  await delay(700);
  const openCount = campaigns.filter((c) => c.status === CS.OPEN).length;
  if (openCount >= ORG_LIMITS.MAX_OPEN_CAMPAIGNS) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.CAMPAIGN_LIMIT_REACHED,
      message: `Tổ chức đang có ${ORG_LIMITS.MAX_OPEN_CAMPAIGNS} chiến dịch đang nhận đồ. Đóng bớt một chiến dịch rồi tạo mới.`,
    });
  }
  const c = {
    ...body,
    id: `oc-${nextId++}`,
    status: CS.OPEN,
    createdAt: new Date().toISOString(),
  };
  campaigns.push(c);
  return campaignView(c);
}

// PUT /campaigns/{id} — bỏ kho còn đơn chờ lấy → 409
export async function updateCampaign(id, body) {
  await seed();
  await delay(600);
  const c = findCampaign(id);
  const removed = c.warehouseIds.filter((w) => !body.warehouseIds.includes(w));
  const blocked = removed.find((w) => pendingCountOf(id, w) > 0);
  if (blocked) {
    throw new ApiError({
      status: 409,
      code: ERROR_CODES.CAMPAIGN_WAREHOUSE_HAS_PENDING,
      message: `${warehouseName(blocked)} còn đồ chờ bạn tới lấy, chưa bỏ kho này được.`,
    });
  }
  Object.assign(c, body);
  return campaignView(c);
}

// Ảnh bìa: bản thật sẽ upload lên /uploads rồi trả URL. Mock giữ nguyên đường dẫn ảnh trong máy để vẫn hiện
export async function uploadCover(uri) {
  await delay(300);
  return uri;
}

// POST /campaigns/{id}/close — đóng sớm
export async function closeCampaign(id) {
  await seed();
  await delay(500);
  const c = findCampaign(id);
  c.status = CS.CLOSED;
  c.endTime = new Date().toISOString();
  return { id, status: c.status };
}

// GET /api/organizations/me/donations?campaignId&warehouseId — mới nhất trước
export async function getDonations({ campaignId, warehouseId }) {
  await seed();
  await delay();
  return donations
    .filter((d) => d.campaignId === campaignId && d.warehouseId === warehouseId)
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))
    .map((d) => ({ ...d, warehouseName: warehouseName(d.warehouseId) }));
}

// POST /campaigns/{id}/donation-notes — chưa tên mà không ẩn danh → 400
export async function createDonationNote(
  campaignId,
  { donorName, isAnonymous, note },
) {
  await seed();
  await delay(500);
  findCampaign(campaignId);
  if (!isAnonymous && !donorName?.trim()) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Nhập tên người quyên góp hoặc chọn Ẩn danh.",
    });
  }
  const n = {
    id: `nt-${nextId++}`,
    campaignId,
    donorName: isAnonymous ? null : donorName.trim(),
    isAnonymous,
    note: note?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  notes.push(n);
  return n;
}
