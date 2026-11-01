// Mock bài viết của tổ chức (OB-01 → OB-05) "sống" trong RAM — reload app là về dữ liệu mẫu.
// Hình dạng theo danh sách đã gửi BE (bài viết 01/11 + L9: tổ chức thả tim, bình luận, trả lời):
//   post    = { id, content, photoUrls, createdAt, likeCount, likedByMe, commentCount, reportCount,
//               campaignId, campaignTitle }
//   comment = { id, parentId (null = bình luận gốc; trả lời chỉ 1 cấp như Facebook), content,
//               status (VISIBLE | REMOVED — bị ẩn thì content = null), createdAt,
//               author: { id, type: MEMBER | ORGANIZATION, fullName, avatarUrl }, isMine }
// Chiến dịch lấy từ mock chiến dịch (orgContentApi.mock) → gắn bài với đúng chiến dịch đang có
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import {
  CAMPAIGN_STATUS,
  COMMENT_AUTHOR_TYPE as AT,
  CONTENT_STATUS as CT,
} from "@/constants/community";
import * as campaignMock from "./orgContentApi.mock";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const photo = (seed) => `https://picsum.photos/seed/${seed}/800/600`;
const notFound = (what = "bài viết") =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: `Không tìm thấy ${what}.`,
  });

let posts = null; // null = chưa tạo dữ liệu mẫu
let comments = {}; // postId → comment[] (phẳng; câu trả lời có parentId)
let nextId = 100;

const post = (
  id,
  content,
  days,
  photos,
  likeCount,
  reportCount,
  campaignId,
) => ({
  id,
  content,
  photoUrls: photos.map((p) => photo(`${id}-${p}`)),
  createdAt: ago(days, "day"),
  likeCount,
  likedByMe: false,
  reportCount,
  campaignId,
});

const comment = (id, name, content, hoursAgo, opts = {}) => ({
  id,
  parentId: opts.parentId ?? null,
  content: opts.removed ? null : content,
  status: opts.removed ? CT.REMOVED : CT.VISIBLE,
  createdAt: ago(hoursAgo, "hour"),
  // isMine = tổ chức đang đăng nhập viết → màn hình lấy tên + logo từ hồ sơ
  author: opts.mine
    ? { id: "me", type: AT.ORGANIZATION, fullName: null, avatarUrl: null }
    : { id: `mb-${id}`, type: AT.MEMBER, fullName: name, avatarUrl: null },
  isMine: !!opts.mine,
});

function seed() {
  if (posts) return;
  posts = [
    post(
      "pt-1",
      "Cảm ơn các bạn đã mang 40 túi áo ấm tới đợt quyên góp tuần trước. Bên mình đã phân loại xong và sẽ trao tới 3 điểm bản vùng cao trong tuần này.",
      2,
      [1, 2],
      86,
      0,
      "oc-1",
    ),
    post(
      "pt-2",
      "Mái ấm tuyển tình nguyện viên phát cơm cuối tuần. Ai rảnh sáng Chủ nhật nhắn cho bên mình nhé.",
      4,
      [1],
      41,
      1,
      null,
    ),
    post(
      "pt-3",
      "Hình ảnh buổi trao quà trung thu cho các em.",
      34,
      [1, 2, 3],
      120,
      0,
      null,
    ),
    post(
      "pt-4",
      "Thông báo giờ nhận đồ mới: 8h–17h mỗi ngày, kể cả cuối tuần.",
      42,
      [],
      33,
      0,
      null,
    ),
  ];
  comments = {
    "pt-1": [
      comment(
        "cm-1",
        "Trần Minh Anh",
        "Chúc mừng bên mình! Tuần sau mình sẽ mang thêm đồ trẻ em tới nhé.",
        2,
      ),
      comment("cm-2", "Lê Thu Hà", "Bên mình nhận đồ lúc mấy giờ vậy ạ?", 5),
      comment(
        "cm-2r",
        null,
        "Bên mình nhận từ 8h đến 17h mỗi ngày nha bạn.",
        4,
        { parentId: "cm-2", mine: true },
      ),
      comment("cm-3", null, null, 20, { removed: true }),
      comment(
        "cm-4",
        "Phạm Quốc Bảo",
        "Cảm ơn mái ấm đã làm việc rất tử tế.",
        26,
      ),
      comment(
        "cm-5",
        "Đặng Mỹ Linh",
        "Mình xin phép chia sẻ bài này nhé.",
        120,
      ),
    ],
    "pt-2": [
      comment("cm-6", "Võ Thanh Tâm", "Mình đăng ký chủ nhật này ạ.", 30),
    ],
  };
}

// Chiến dịch của tổ chức (mock N8) → tên để gắn vào bài
async function campaignTitles() {
  const list = await campaignMock.getMyCampaigns();
  return Object.fromEntries(list.map((c) => [c.id, c.title]));
}

const visibleCount = (postId) =>
  (comments[postId] ?? []).filter((c) => c.status === CT.VISIBLE).length;

const postView = (p, titles) => ({
  ...p,
  photoUrls: [...p.photoUrls],
  commentCount: visibleCount(p.id),
  campaignTitle: p.campaignId ? (titles[p.campaignId] ?? null) : null,
});

const findPost = (id) => {
  const p = posts.find((x) => x.id === id);
  if (!p) throw notFound();
  return p;
};

// Chỉ cho gắn chiến dịch ĐANG MỞ của chính tổ chức (OB-02 "Chỉ liệt kê chiến dịch đang diễn ra")
async function checkCampaign(campaignId) {
  if (!campaignId) return;
  const list = await campaignMock.getMyCampaigns();
  const c = list.find((x) => x.id === campaignId);
  if (!c || c.status !== CAMPAIGN_STATUS.OPEN)
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Chỉ gắn được chiến dịch đang diễn ra.",
    });
}

// GET /api/organizations/me/posts — mới nhất trước
export async function getMyPosts() {
  seed();
  const titles = await campaignTitles();
  await delay();
  return [...posts]
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))
    .map((p) => postView(p, titles));
}

// GET /posts/{id}
export async function getMyPost(id) {
  seed();
  const titles = await campaignTitles();
  await delay(300);
  return postView(findPost(id), titles);
}

// POST /posts { content, photoUrls, campaignId }
export async function createPost({ content, photoUrls, campaignId }) {
  seed();
  await checkCampaign(campaignId);
  await delay(700);
  const p = {
    id: `pt-${nextId++}`,
    content,
    photoUrls,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
    reportCount: 0,
    campaignId: campaignId ?? null,
  };
  posts.push(p);
  return { id: p.id, status: CT.VISIBLE };
}

// PUT /posts/{id} — sửa nội dung, ảnh, chiến dịch. Giữ nguyên chiến dịch cũ (dù đã đóng) thì không kiểm
export async function updatePost(id, { content, photoUrls, campaignId }) {
  seed();
  const p = findPost(id);
  if (campaignId !== p.campaignId) await checkCampaign(campaignId);
  await delay(600);
  Object.assign(p, {
    content,
    photoUrls,
    campaignId: campaignId ?? null,
  });
  return { id, content };
}

// DELETE /posts/{id} — BE chuyển REMOVED (không xoá cứng); bài biến khỏi mọi danh sách
export async function deletePost(id) {
  seed();
  await delay(500);
  findPost(id);
  posts = posts.filter((p) => p.id !== id);
}

// POST / DELETE /posts/{id}/like — tổ chức thả tim bài của mình (L9)
export async function setPostLiked(id, liked) {
  seed();
  await delay(200);
  const p = findPost(id);
  if (p.likedByMe !== liked) {
    p.likedByMe = liked;
    p.likeCount += liked ? 1 : -1;
  }
  return { likedByMe: p.likedByMe, likeCount: p.likeCount };
}

// GET /posts/{id}/comments — phẳng, mỗi câu trả lời có parentId; màn hình tự xếp nhóm
export async function getPostComments(id) {
  seed();
  await delay();
  findPost(id);
  return (comments[id] ?? []).map((c) => ({ ...c, author: { ...c.author } }));
}

// POST /posts/{id}/comments { content, parentId } — tổ chức bình luận / trả lời (L9).
// Trả lời một câu trả lời → gắn vào bình luận gốc (chỉ 1 cấp như Facebook)
export async function createComment(postId, { content, parentId }) {
  seed();
  await delay(400);
  findPost(postId);
  const list = comments[postId] ?? (comments[postId] = []);
  let rootId = null;
  if (parentId) {
    const parent = list.find((c) => c.id === parentId);
    if (!parent) throw notFound("bình luận");
    rootId = parent.parentId ?? parent.id;
  }
  const c = comment(`cm-${nextId++}`, null, content.trim(), 0, {
    parentId: rootId,
    mine: true,
  });
  c.createdAt = new Date().toISOString();
  list.push(c);
  return { ...c, author: { ...c.author } };
}

// Ảnh bài viết: bản thật upload thư mục COMMUNITY_POSTS rồi trả URL. Mock giữ nguyên ảnh trong máy để vẫn hiện
export async function uploadPostPhoto(uri) {
  await delay(300);
  return uri;
}
