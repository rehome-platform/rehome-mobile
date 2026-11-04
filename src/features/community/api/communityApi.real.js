import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { matchesSearch } from "@/utils/search";
import { CAMPAIGN_STATUS as CS, FEED_SCOPE } from "@/constants/community";

// Cộng đồng phía Member — API thật (100–109, BE edff4ae). Cùng hình dạng dữ liệu với communityApi.mock.js.
// Đổi dữ liệu BE → dạng màn hình đang dùng:
// - chiến dịch: status ACTIVE → OPEN; nơi nhận = địa chỉ riêng tổ chức (ownAddress) + các kho → places
// - tổ chức: mã orgType / operationScope → nhãn (GET /options cần đăng nhập, Guest không gọi được → bảng nhãn ở đây)
// - bình luận BE trả mới trước → đảo lại cũ trước, câu trả lời (parentId) xếp ngay dưới bình luận gốc

const ORG_TYPE_LABEL = {
  CHARITY_FUND: "Quỹ từ thiện",
  NGO: "Tổ chức phi chính phủ",
  SCHOOL_CLUB: "Câu lạc bộ trường học",
  VOLUNTEER_GROUP: "Nhóm tình nguyện / cộng đồng",
  SOCIAL_PROTECTION_CENTER: "Cơ sở bảo trợ xã hội",
  RELIGIOUS: "Cơ sở tôn giáo",
  OTHER: "Khác",
};
const SCOPE_LABEL = {
  NATIONAL: "Toàn quốc",
  PROVINCE: "Cấp tỉnh / thành phố",
  DISTRICT: "Cấp quận / huyện",
  WARD: "Cấp phường / xã",
};
const STATUS_FROM_BE = { ACTIVE: CS.OPEN, OPEN: CS.OPEN, CLOSED: CS.CLOSED };
const BIG_PAGE = 50; // danh sách ngắn (chiến dịch của 1 tổ chức, đang theo dõi) → lấy 1 trang (BE tối đa 50)

const label = (map, code) => (code ? (map[code] ?? code) : null);

// Tổ chức công khai chỉ gồm tổ chức đã xác minh → verified luôn true
const toOrgBrief = (o) =>
  o
    ? { ...o, verified: true, orgTypeLabel: label(ORG_TYPE_LABEL, o.orgType) }
    : null;

const toOrganization = (o) => ({
  ...toOrgBrief(o),
  operationScopeLabel: label(SCOPE_LABEL, o.operationScope),
  donationPoint: {
    name: o.donationPointName,
    address: o.donationPointAddress,
    latitude: o.donationPointLatitude,
    longitude: o.donationPointLongitude,
    receivingHours: o.donationPointReceivingHours,
  },
});

// Nơi nhận đồ của chiến dịch (CD-04): địa chỉ riêng (có toạ độ) trước, rồi các kho (chỉ đường theo địa chỉ)
const placesOf = (c) => [
  ...(c.receiveAtOwnAddress && c.ownAddress
    ? [
        {
          key: "own",
          title: c.ownAddress.name || "Địa chỉ của tổ chức",
          address: c.ownAddress.address,
          hours: c.ownAddress.receivingHours,
          latitude: c.ownAddress.latitude,
          longitude: c.ownAddress.longitude,
        },
      ]
    : []),
  ...(c.warehouses ?? []).map((w) => ({
    key: w.id,
    title: w.name,
    address: w.address,
    hours: w.openingHours,
    latitude: null,
    longitude: null,
  })),
];

const toCampaign = (c) => ({
  ...c,
  status: STATUS_FROM_BE[c.status] ?? c.status,
  organizationId: c.organization?.id ?? null,
  organization: toOrgBrief(c.organization),
  preferredItemTypes: c.preferredItemTypes ?? [],
  places: placesOf(c),
});

// Đang nhận lên trước, rồi gần hết hạn trước
const byCampaignOrder = (a, b) =>
  a.status === b.status
    ? new Date(a.endTime) - new Date(b.endTime)
    : a.status === CS.OPEN
      ? -1
      : 1;

const toPost = (p) => ({
  ...p,
  organizationId: p.organizationId ?? p.organization?.id ?? null,
  organization: toOrgBrief(p.organization),
  photoUrls: p.photoUrls ?? [],
});

const mapPage = (p, fn) => ({ ...p, content: (p?.content ?? []).map(fn) });

// ---------- API 100 ----------
export async function getOrganization(id) {
  return toOrganization(unwrap(await api.get(`/api/organizations/${id}`)));
}

// ---------- API 101 ---------- BE đã xếp gần trước
export async function getNearbyOrganizations({ lat, lng }) {
  const list =
    unwrap(
      await api.get("/api/organizations/nearby", { params: { lat, lng } }),
    ) ?? [];
  return list.map((o) => ({
    organizationId: o.id,
    displayName: o.displayName,
    logoUrl: o.logoUrl,
    orgTypeLabel: label(ORG_TYPE_LABEL, o.orgType),
    donationPoint: {
      address: o.donationPointAddress,
      latitude: o.donationPointLatitude,
      longitude: o.donationPointLongitude,
      receivingHours: o.donationPointReceivingHours,
    },
    distanceKm: o.distanceKm,
    activeCampaigns: o.activeCampaigns ?? [],
  }));
}

// Chiến dịch (mọi trạng thái) của một tổ chức
export async function getOrgCampaigns(orgId) {
  const p = unwrap(
    await api.get(`/api/organizations/${orgId}/campaigns`, {
      params: { size: BIG_PAGE },
    }),
  );
  return (p?.content ?? []).map(toCampaign).sort(byCampaignOrder);
}

// ---------- API 102 ----------
export async function getCampaign(id) {
  return toCampaign(unwrap(await api.get(`/campaigns/${id}`)));
}

// Mọi chiến dịch đang nhận đồ (chip Chiến dịch ở CD-01)
export async function getOpenCampaigns({ page = 0, size = 20 } = {}) {
  const p = unwrap(
    await api.get("/campaigns", { params: { status: "ACTIVE", page, size } }),
  );
  return mapPage(p, toCampaign);
}

// ---------- Tìm kiếm (CD-01 · ô "Tìm tổ chức, chiến dịch") ----------
// [CHỜ BE] GET /api/organizations?search= (danh sách tổ chức đã xác minh) chưa có → 404/405 thì báo chờ máy chủ
export async function searchOrganizations({ search, page = 0, size = 20 }) {
  try {
    const p = unwrap(
      await api.get("/api/organizations", { params: { search, page, size } }),
    );
    return mapPage(p, toOrgBrief);
  } catch (e) {
    if (e.status === 404 || e.status === 405)
      throw new ApiError({
        status: 501,
        code: "SEARCH_NOT_READY",
        message: "Tìm tổ chức theo tên sẽ có khi máy chủ cập nhật.",
      });
    throw e;
  }
}

// [CHỜ BE] /campaigns chưa nhận ?search= (bỏ qua tham số, trả mọi chiến dịch) → lọc thêm trên máy
// theo tên chiến dịch / tên tổ chức để kết quả luôn đúng; BE thêm search thì phần lọc này vô hại
export async function searchCampaigns({ search, page = 0, size = 20 }) {
  const p = unwrap(
    await api.get("/campaigns", {
      params: { status: "ACTIVE", search, page, size },
    }),
  );
  const page_ = mapPage(p, toCampaign);
  return {
    ...page_,
    content: page_.content.filter((c) =>
      matchesSearch(search, c.title, c.organization?.displayName),
    ),
  };
}

// ---------- API 103 ----------
export async function follow(orgId) {
  return unwrap(await api.post(`/api/organizations/${orgId}/follow`));
}
export async function unfollow(orgId) {
  return unwrap(await api.delete(`/api/organizations/${orgId}/follow`));
}

// Tổ chức đang theo dõi (PR-01)
export async function getMyFollowing() {
  const p = unwrap(
    await api.get("/api/organizations/following", {
      params: { size: BIG_PAGE },
    }),
  );
  return (p?.content ?? []).map(toOrgBrief);
}

// ---------- API 104 ---------- scope ALL | FOLLOWING; organizationId = bài của một tổ chức
export async function getPosts({
  scope = FEED_SCOPE.ALL,
  organizationId,
  page = 0,
  size = 10,
} = {}) {
  const p = unwrap(
    await api.get("/posts", {
      params: {
        ...(organizationId ? { organizationId } : { scope }),
        page,
        size,
      },
    }),
  );
  return mapPage(p, toPost);
}

// ---------- API 105 ---------- isFollowing lấy từ trang tổ chức (bài không trả kèm)
export async function getPost(id) {
  const post = toPost(unwrap(await api.get(`/posts/${id}`)));
  const org = post.organizationId
    ? await getOrganization(post.organizationId).catch(() => null)
    : null;
  return {
    ...post,
    organization: org ?? post.organization,
    isFollowing: org?.isFollowing ?? false,
  };
}

// ---------- API 106 ----------
export async function like(postId) {
  return unwrap(await api.post(`/posts/${postId}/like`));
}
export async function unlike(postId) {
  return unwrap(await api.delete(`/posts/${postId}/like`));
}

const toComment = (c) => ({
  ...c,
  author: {
    id: c.author?.id ?? null,
    type: c.author?.type ?? null,
    fullName: c.author?.displayName ?? "Người dùng",
    avatarUrl: c.author?.avatarUrl ?? null,
  },
});

// Cũ trước (đọc như hội thoại); câu trả lời ngay dưới bình luận gốc của nó
export const threadComments = (list) => {
  const asc = [...list].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const roots = asc.filter(
    (c) => !c.parentId || !asc.some((x) => x.id === c.parentId),
  );
  return roots.flatMap((r) => [r, ...asc.filter((c) => c.parentId === r.id)]);
};

// ---------- API 107 ---------- BE trả mới trước theo trang → lấy 1 trang lớn rồi xếp lại (bài ít bình luận)
export async function getComments(postId, { page = 0 } = {}) {
  if (page > 0)
    return { content: [], page, size: 100, totalElements: 0, totalPages: 1 };
  const p = unwrap(
    await api.get(`/posts/${postId}/comments`, {
      params: { page: 0, size: 100 },
    }),
  );
  return {
    ...p,
    content: threadComments((p?.content ?? []).map(toComment)),
    totalPages: 1,
  };
}

// ---------- API 108 ---------- parentId = trả lời; trả lời một câu trả lời thì BE tự gắn vào bình luận gốc
export async function addComment(postId, content, parentId = null) {
  return toComment(
    unwrap(await api.post(`/posts/${postId}/comments`, { content, parentId })),
  );
}

// ---------- API 109 ---------- targetType: POST | CAMPAIGN | ORGANIZATION_ACCOUNT
export async function report({ targetType, targetId, reason }) {
  return unwrap(
    await api.post("/violation-reports", { targetType, targetId, reason }),
  );
}
