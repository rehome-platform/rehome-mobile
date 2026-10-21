// Mock cộng đồng (API 100–109) "sống" trong RAM: tổ chức, chiến dịch, bài viết, bình luận, theo dõi, báo cáo.
// Field theo entity BE (a0c6abe: Campaign, CommunityPost) + field mobile xin thêm [CHỜ BE PHASE6_GUIDE câu 8–15]:
// organization trong bài / chiến dịch, title, coverUrl, photoUrls, likeCount, likedByMe, logo, điểm nhận đồ…
// Phía tổ chức (nhánh 7–10) sẽ dùng chung kho dữ liệu này. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { CAMPAIGN_STATUS as CS, FEED_SCOPE } from "@/constants/community";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const photo = (seed, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
const notFound = (what) =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: `Không tìm thấy ${what}.`,
  });
const paginate = (list, page, size) => ({
  content: list.slice(page * size, (page + 1) * size),
  page,
  size,
  totalElements: list.length,
  totalPages: Math.ceil(list.length / size),
});

// ---------- Tổ chức (đã xác minh) ----------
const org = (
  id,
  displayName,
  orgTypeLabel,
  operationScopeLabel,
  point,
  extra,
) => ({
  id,
  displayName,
  orgTypeLabel, // [CHỜ BE câu 10] BE trả mã orgType → app đổi nhãn
  operationScopeLabel,
  logoUrl: photo(`logo-${id}`, 200, 200),
  verifiedAt: ago(40, "day"),
  description: "",
  donationPoint: point, // {name, address, latitude, longitude, receivingHours}
  followerCount: 0,
  ...extra,
});

let organizations = [
  org(
    "org-hat-mam",
    "Quỹ Hạt Mầm Xanh",
    "Quỹ từ thiện",
    "Toàn quốc",
    {
      name: "Điểm nhận đồ Quận 1",
      address: "88 Lê Lợi, P. Bến Nghé, Quận 1",
      latitude: 10.7745,
      longitude: 106.7019,
      receivingHours: "Thứ 2 – Thứ 7 · 08:00 – 17:00",
    },
    {
      description:
        "Quỹ hỗ trợ trẻ em vùng cao và trẻ mồ côi: quần áo ấm, đồ dùng học tập. Mọi món quyên góp được kiểm và phân loại trước khi gửi đi.",
      followerCount: 1204,
    },
  ),
  org(
    "org-huong-duong",
    "Mái ấm Hướng Dương",
    "Cơ sở trợ giúp xã hội",
    "TP. Hồ Chí Minh",
    {
      name: "Mái ấm Hướng Dương",
      address: "120 Nguyễn Thị Thập, P. Tân Phú, Quận 7",
      latitude: 10.7381,
      longitude: 106.7152,
      receivingHours: "Thứ 2 – Chủ nhật · 07:00 – 19:00",
    },
    {
      description:
        "Nuôi dưỡng 40 cụ già neo đơn và 25 trẻ có hoàn cảnh khó khăn.",
      followerCount: 532,
    },
  ),
  org(
    "org-hoa-sen",
    "Mái ấm Hoa Sen",
    "Cơ sở trợ giúp xã hội",
    "TP. Hồ Chí Minh",
    {
      name: "Mái ấm Hoa Sen",
      address: "45 Võ Văn Tần, P. Võ Thị Sáu, Quận 3",
      latitude: 10.7769,
      longitude: 106.6903,
      receivingHours: "Thứ 2 – Thứ 6 · 08:00 – 16:00",
    },
    {
      description:
        "Mái ấm cho trẻ em đường phố, có lớp học tình thương buổi tối.",
      followerCount: 318,
    },
  ),
  org(
    "org-bk",
    "CLB Thiện Nguyện ĐH Bách Khoa",
    "Câu lạc bộ, nhóm thiện nguyện",
    "TP. Hồ Chí Minh",
    {
      name: "Sảnh B4, ĐH Bách Khoa",
      address: "268 Lý Thường Kiệt, P. 14, Quận 10",
      latitude: 10.7724,
      longitude: 106.6578,
      receivingHours: "Thứ 7 – Chủ nhật · 08:00 – 11:00",
    },
    {
      description: "Sinh viên gom đồ cũ cho các chuyến tình nguyện về quê.",
      followerCount: 87,
    },
  ),
];

let following = new Set(["org-hat-mam", "org-huong-duong"]); // Member mock đang theo dõi

// ---------- Chiến dịch ----------
const campaign = (
  id,
  organizationId,
  title,
  description,
  startDays,
  endDays,
  status,
  types,
) => {
  const o = organizations.find((x) => x.id === organizationId);
  return {
    id,
    organizationId,
    title, // [CHỜ BE câu 11] bảng chưa có
    coverUrl: photo(`cp-${id}`, 800, 450), // [CHỜ BE câu 11]
    description,
    startTime: ago(startDays, "day"),
    endTime: endDays >= 0 ? later(endDays, "day") : ago(-endDays, "day"),
    locationName: o.donationPoint.name,
    address: o.donationPoint.address, // [CHỜ BE câu 11]
    latitude: o.donationPoint.latitude,
    longitude: o.donationPoint.longitude,
    receivingHours: o.donationPoint.receivingHours, // [CHỜ BE câu 11]
    preferredItemTypes: types,
    status,
    createdAt: ago(startDays, "day"),
  };
};

let campaigns = [
  campaign(
    "cp-1",
    "org-hat-mam",
    "Áo ấm cho trẻ vùng cao mùa đông 2026",
    "Mùa đông năm nay dự báo rét đậm sớm. Quỹ cần áo khoác, áo len, khăn mũ cho khoảng 600 em ở Hà Giang và Lào Cai. Đồ cần sạch, còn dùng tốt.",
    10,
    50,
    CS.OPEN,
    ["Áo khoác", "Áo len", "Khăn, mũ", "Đồ trẻ em 3–12 tuổi"],
  ),
  campaign(
    "cp-2",
    "org-hat-mam",
    "Quần áo đi học cho trẻ mồ côi",
    "Chuẩn bị học kỳ mới cho 120 em ở các mái ấm đối tác: quần áo đồng phục, áo khoác mỏng, giày dép.",
    5,
    60,
    CS.OPEN,
    ["Quần dài", "Giày dép", "Đồ dùng học tập"],
  ),
  campaign(
    "cp-3",
    "org-hat-mam",
    "Hỗ trợ bà con vùng lũ miền Trung",
    "Đã khép lại sau 3 tuần. Cảm ơn hơn 400 người đã mang đồ tới.",
    60,
    -20,
    CS.CLOSED,
    ["Chăn, màn", "Quần dài"],
  ),
  campaign(
    "cp-4",
    "org-huong-duong",
    "Đồ ấm cho các cụ ở mái ấm",
    "Các cụ cần áo len, khăn và chăn mỏng cho mùa mưa.",
    7,
    25,
    CS.OPEN,
    ["Áo len", "Khăn, mũ", "Chăn, màn"],
  ),
  campaign(
    "cp-5",
    "org-bk",
    "Tủ đồ cho chuyến tình nguyện Tết",
    "Gom quần áo người lớn và trẻ em cho chuyến về Bến Tre dịp Tết.",
    3,
    10,
    CS.OPEN,
    ["Áo khoác", "Quần dài", "Đồ trẻ em 3–12 tuổi"],
  ),
];

// ---------- Bài viết + bình luận ----------
let posts = [];
let comments = [];
let seq = 0;
const post = (
  organizationId,
  content,
  hoursAgo,
  nPhotos,
  likeCount,
  likedByMe = false,
) => {
  seq += 1;
  const id = `post-${seq}`;
  posts.push({
    id,
    organizationId,
    content,
    photoUrls: Array.from({ length: nPhotos }, (_, i) => photo(`${id}-${i}`)),
    likeCount,
    likedByMe,
    status: "VISIBLE",
    createdAt: ago(hoursAgo, "hour"),
  });
  return id;
};
const comment = (postId, fullName, content, minutesAgo, isMine = false) => {
  seq += 1;
  comments.push({
    id: `cmt-${seq}`,
    postId,
    author: { id: isMine ? "me" : `u-${seq}`, fullName, avatarUrl: null },
    content,
    isMine,
    status: "VISIBLE",
    createdAt: ago(minutesAgo, "minute"),
  });
};

const p1 = post(
  "org-hat-mam",
  "Chuyến xe thứ hai đã lên Hà Giang! 312 chiếc áo khoác và 180 bộ khăn mũ đã tới tay các em ở điểm trường Lũng Cú. Cảm ơn mọi người đã mang đồ tới điểm nhận Quận 1 🌱",
  2,
  3,
  48,
  true,
);
comment(
  p1,
  "Nguyễn Thu Hà",
  "Nhìn các em vui quá, tuần sau mình mang thêm áo len nhé.",
  60,
);
comment(p1, "Bạn", "Quỹ còn nhận đồ trẻ em 10–12 tuổi không ạ?", 42, true);
comment(p1, "Trần Minh Khoa", "Đã chia sẻ cho nhóm lớp rồi ạ.", 20);
post(
  "org-huong-duong",
  "Các cụ ở mái ấm vừa nhận chăn mới từ chiến dịch tháng trước. Cảm ơn các bạn sinh viên đã tới phụ phân loại đồ cuối tuần qua.",
  26,
  0,
  23,
);
const p3 = post(
  "org-bk",
  "Buổi phân loại đồ cuối tuần: 46 bạn tình nguyện viên, 1,2 tấn quần áo. Đồ còn tốt sẽ theo chuyến Tết về Bến Tre.",
  50,
  2,
  91,
);
comment(p3, "Lê Gia Bảo", "Năm sau em đăng ký tham gia ạ!", 30 * 60);
post(
  "org-hoa-sen",
  "Mái ấm tuyển tình nguyện viên phát cơm chiều thứ Bảy. Ai rảnh nhắn tin cho mái ấm nhé.",
  72,
  1,
  15,
);
post(
  "org-hat-mam",
  "Nhắc mọi người: đồ quyên góp cần giặt sạch, gấp gọn, áo khoác nên còn khoá kéo. Đồ hỏng quá nặng mái ấm khó dùng lại được.",
  96,
  0,
  37,
);
post(
  "org-huong-duong",
  "Cảm ơn nhóm Bách Khoa đã ghé hát cho các cụ nghe chiều qua.",
  140,
  4,
  64,
  true,
);
post(
  "org-bk",
  "Lịch nhận đồ tháng này: sáng Thứ 7 và Chủ nhật tại sảnh B4.",
  200,
  0,
  12,
);

// ---------- Báo cáo ----------
let reports = [];

// ---------- Chuyển dữ liệu ra ngoài ----------
const orgBrief = (id) => {
  const o = organizations.find((x) => x.id === id);
  return o
    ? {
        id: o.id,
        displayName: o.displayName,
        logoUrl: o.logoUrl,
        operationScopeLabel: o.operationScopeLabel,
        verified: true,
      }
    : null;
};

const commentCountOf = (postId) =>
  comments.filter((c) => c.postId === postId && c.status === "VISIBLE").length;

const postView = (p) => ({
  ...p,
  photoUrls: [...p.photoUrls],
  commentCount: commentCountOf(p.id),
  organization: orgBrief(p.organizationId),
});

const campaignView = (c) => ({
  ...c,
  preferredItemTypes: [...c.preferredItemTypes],
  organization: orgBrief(c.organizationId),
});

// Đang nhận lên trước, rồi gần hết hạn trước
const byCampaignOrder = (a, b) =>
  a.status === b.status
    ? dayjs(a.endTime).diff(b.endTime)
    : a.status === CS.OPEN
      ? -1
      : 1;

// Khoảng cách chim bay (haversine), km
const distanceKm = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// ---------- API 100 ----------
export async function getOrganization(id) {
  await delay(400);
  const o = organizations.find((x) => x.id === id);
  if (!o) throw notFound("tổ chức");
  return {
    ...o,
    donationPoint: { ...o.donationPoint },
    isFollowing: following.has(id),
    campaignCount: campaigns.filter((c) => c.organizationId === id).length, // [CHỜ BE câu 10]
    postCount: posts.filter((p) => p.organizationId === id).length,
  };
}

// ---------- API 101 ----------
export async function getNearbyOrganizations({ lat, lng }) {
  await delay();
  return organizations
    .map((o) => ({
      organizationId: o.id,
      displayName: o.displayName,
      logoUrl: o.logoUrl,
      orgTypeLabel: o.orgTypeLabel,
      donationPoint: { ...o.donationPoint },
      distanceKm: distanceKm(
        { lat, lng },
        { lat: o.donationPoint.latitude, lng: o.donationPoint.longitude },
      ),
      activeCampaigns: campaigns
        .filter((c) => c.organizationId === o.id && c.status === CS.OPEN)
        .map((c) => ({ id: c.id, endTime: c.endTime })),
    }))
    .filter((o) => o.distanceKm <= 5) // [KIỂM TRA] bán kính BE dùng
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// [CHỜ BE câu 9] chiến dịch công khai của một tổ chức
export async function getOrgCampaigns(orgId) {
  await delay();
  return campaigns
    .filter((c) => c.organizationId === orgId)
    .sort(byCampaignOrder)
    .map(campaignView);
}

// ---------- API 102 ----------
export async function getCampaign(id) {
  await delay(400);
  const c = campaigns.find((x) => x.id === id);
  if (!c) throw notFound("chiến dịch");
  return campaignView(c);
}

// [CHỜ BE câu 9] mọi chiến dịch đang nhận đồ (chip Chiến dịch ở CD-01)
export async function getOpenCampaigns({ page = 0, size = 20 } = {}) {
  await delay();
  return paginate(
    campaigns
      .filter((c) => c.status === CS.OPEN)
      .sort(byCampaignOrder)
      .map(campaignView),
    page,
    size,
  );
}

// ---------- API 103 ----------
export async function follow(orgId) {
  await delay(300);
  if (!following.has(orgId)) {
    following.add(orgId);
    const o = organizations.find((x) => x.id === orgId);
    if (o) o.followerCount += 1;
  }
  return null;
}
export async function unfollow(orgId) {
  await delay(300);
  if (following.delete(orgId)) {
    const o = organizations.find((x) => x.id === orgId);
    if (o) o.followerCount -= 1;
  }
  return null;
}
// [CHỜ BE câu 14] tổ chức mình đang theo dõi (PR-01)
export async function getMyFollowing() {
  await delay();
  return organizations
    .filter((o) => following.has(o.id))
    .map((o) => ({ ...orgBrief(o.id), orgTypeLabel: o.orgTypeLabel }));
}

// ---------- API 104 ----------
// scope ALL = mọi tổ chức [CHỜ BE câu 8]; FOLLOWING = tổ chức đang theo dõi; organizationId = bài của một tổ chức
export async function getPosts({
  scope = FEED_SCOPE.ALL,
  organizationId,
  page = 0,
  size = 10,
} = {}) {
  await delay();
  const list = posts
    .filter((p) => p.status === "VISIBLE")
    .filter((p) => !organizationId || p.organizationId === organizationId)
    .filter(
      (p) => scope !== FEED_SCOPE.FOLLOWING || following.has(p.organizationId),
    )
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt));
  return paginate(list.map(postView), page, size);
}

// ---------- API 105 ----------
export async function getPost(id) {
  await delay(400);
  const p = posts.find((x) => x.id === id && x.status === "VISIBLE");
  if (!p) throw notFound("bài viết");
  return { ...postView(p), isFollowing: following.has(p.organizationId) };
}

// ---------- API 106 ----------
export async function like(postId) {
  await delay(300);
  const p = posts.find((x) => x.id === postId);
  if (!p) throw notFound("bài viết");
  if (!p.likedByMe) {
    p.likedByMe = true;
    p.likeCount += 1;
  }
  return null;
}
export async function unlike(postId) {
  await delay(300);
  const p = posts.find((x) => x.id === postId);
  if (!p) throw notFound("bài viết");
  if (p.likedByMe) {
    p.likedByMe = false;
    p.likeCount -= 1;
  }
  return null;
}

// ---------- API 107 ---------- cũ trước, mới sau (đọc như hội thoại)
export async function getComments(postId, { page = 0, size = 20 } = {}) {
  await delay();
  const list = comments
    .filter((c) => c.postId === postId && c.status === "VISIBLE")
    .sort((a, b) => dayjs(a.createdAt).diff(b.createdAt))
    .map((c) => ({ ...c, author: { ...c.author } }));
  return paginate(list, page, size);
}

// ---------- API 108 ----------
export async function addComment(postId, content) {
  await delay();
  if (!posts.some((p) => p.id === postId)) throw notFound("bài viết");
  const text = content?.trim();
  if (!text)
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Bình luận đang trống.",
    });
  seq += 1;
  const c = {
    id: `cmt-${seq}`,
    postId,
    author: { id: "me", fullName: "Bạn", avatarUrl: null },
    content: text,
    isMine: true,
    status: "VISIBLE",
    createdAt: dayjs().toISOString(),
  };
  comments.push(c);
  return { ...c, author: { ...c.author } };
}

// ---------- API 109 ----------
export async function report({ targetType, targetId, reason }) {
  await delay(700);
  if (!targetType || !targetId || !reason?.trim())
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Chọn lý do báo cáo.",
    });
  seq += 1;
  const r = {
    id: `rp-${seq}`,
    targetType,
    targetId,
    reason,
    status: "PENDING",
  };
  reports.push(r);
  return { id: r.id, status: r.status };
}
