import { ApiError } from "@/lib/api/errors";

// [CHỜ BE] BE (25d8c85) có /posts, /api/organizations/me/posts nhưng response thiếu ảnh, ngày đăng, chiến dịch,
// số báo cáo; sửa bài chỉ sửa được content; bình luận thiếu người viết + thời gian (đã gửi BE 01/11).
// BE xong thì viết thật tại đây, cùng tên hàm và hình dạng dữ liệu với orgPostApi.mock.js
const notReady = async () => {
  throw new ApiError({
    status: 501,
    code: "HTTP_501",
    message: "Chức năng này đang chờ máy chủ cập nhật.",
  });
};

export const getMyPosts = notReady;
export const getMyPost = notReady;
export const createPost = notReady;
export const updatePost = notReady;
export const deletePost = notReady;
export const getPostComments = notReady;
export const setPostLiked = notReady; // [CHỜ BE] POST / DELETE /posts/{id}/like cho ORGANIZATION (L9)
export const createComment = notReady; // [CHỜ BE] POST /posts/{id}/comments cho ORGANIZATION + parentId (L9)
export const uploadPostPhoto = notReady; // thật: uploadFile(file, UPLOAD_FOLDER.COMMUNITY_POSTS)
