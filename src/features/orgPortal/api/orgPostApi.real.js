import { api, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { uploadFile } from "@/lib/api/upload";
import { UPLOAD_FOLDER } from "@/constants/upload";

// Bài viết của tổ chức (OB-01 → OB-05) + L9 — API thật (BE 41f10c8). Cùng tên hàm và hình dạng dữ liệu với
// orgPostApi.mock.js. Chỗ lệch BE:
// - danh sách /me/posts và bình luận phân trang (tối đa 50 / trang) → gom đủ các trang thành mảng
// - chi tiết /posts/{id} không có reportCount → lấy từ danh sách /me/posts
// - người bình luận: author.displayName → author.fullName (giống phía Member)
// - sửa bài vẫn gắn chiến dịch đã đóng → BE báo "Không tìm thấy chiến dịch." → đổi câu dễ hiểu

const PAGE_SIZE = 50; // BE tối đa 50
const MAX_PAGES = 10; // chặn vòng lặp nếu BE trả totalPages sai

async function allPages(url) {
  const items = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const p = unwrap(await api.get(url, { params: { page, size: PAGE_SIZE } }));
    items.push(...(p?.content ?? []));
    if (page + 1 >= (p?.totalPages ?? 1)) break;
  }
  return items;
}

const toPost = (p) => ({
  ...p,
  photoUrls: p.photoUrls ?? [],
  likeCount: p.likeCount ?? 0,
  commentCount: p.commentCount ?? 0,
  reportCount: p.reportCount ?? 0,
  likedByMe: !!p.likedByMe,
  campaignId: p.campaignId ?? null,
  campaignTitle: p.campaignTitle ?? null,
});

const toComment = (c) => ({
  ...c,
  author: {
    id: c.author?.id ?? null,
    type: c.author?.type ?? null,
    fullName: c.author?.displayName ?? "Người dùng",
    avatarUrl: c.author?.avatarUrl ?? null,
  },
});

const CAMPAIGN_GONE = "Không tìm thấy chiến dịch.";
async function friendlyCampaign(promise) {
  try {
    return await promise;
  } catch (e) {
    if (e?.message !== CAMPAIGN_GONE) throw e;
    throw new ApiError({
      status: e.status,
      code: e.code,
      message:
        "Chiến dịch đã đóng nên không gắn được nữa. Bỏ gắn hoặc chọn chiến dịch đang nhận đồ.",
    });
  }
}

// GET /api/organizations/me/posts — mới nhất trước
export async function getMyPosts() {
  const list = await allPages("/api/organizations/me/posts");
  return list.map(toPost);
}

// GET /posts/{id} + reportCount từ /me/posts (chi tiết công khai không có số báo cáo)
export async function getMyPost(id) {
  const [detail, mine] = await Promise.all([
    api.get(`/posts/${id}`).then(unwrap),
    getMyPosts().catch(() => []),
  ]);
  const row = mine.find((p) => p.id === id);
  return toPost({ ...detail, reportCount: row?.reportCount ?? 0 });
}

// POST /posts { content, photoUrls, campaignId } → { id, status }
export async function createPost(body) {
  return friendlyCampaign(api.post("/posts", body).then(unwrap));
}

// PUT /posts/{id} — ảnh gửi lên thay hẳn danh sách cũ; campaignId null = gỡ chiến dịch
export async function updatePost(id, body) {
  return friendlyCampaign(api.put(`/posts/${id}`, body).then(unwrap));
}

// DELETE /posts/{id} — BE chuyển REMOVED
export async function deletePost(id) {
  return unwrap(await api.delete(`/posts/${id}`));
}

// POST / DELETE /posts/{id}/like (L9). BE không trả số mới → màn hình tải lại sau khi xong
export async function setPostLiked(id, liked) {
  const res = liked
    ? await api.post(`/posts/${id}/like`)
    : await api.delete(`/posts/${id}/like`);
  unwrap(res);
  return { likedByMe: liked };
}

// GET /posts/{id}/comments — phẳng, kể cả bị ẩn (content null); màn hình tự xếp nhóm theo parentId
export async function getPostComments(id) {
  const list = await allPages(`/posts/${id}/comments`);
  return list.map(toComment);
}

// POST /posts/{id}/comments { content, parentId } — trả lời 1 câu trả lời thì BE tự gắn vào bình luận gốc
export async function createComment(postId, { content, parentId }) {
  return toComment(
    unwrap(
      await api.post(`/posts/${postId}/comments`, {
        content: content.trim(),
        parentId: parentId ?? null,
      }),
    ),
  );
}

// Ảnh trong máy → POST /uploads?folder=COMMUNITY_POSTS → URL
export async function uploadPostPhoto(uri) {
  const res = await uploadFile(
    { uri, name: "post.jpg", mimeType: "image/jpeg" },
    UPLOAD_FOLDER.COMMUNITY_POSTS,
  );
  return res.url;
}
