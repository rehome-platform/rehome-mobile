import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgPostApi } from "@/features/orgPortal/api/orgPostApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";

// OB-01: bài viết của tổ chức đang đăng nhập, mới nhất trước
export const useMyPosts = () =>
  useQuery({ queryKey: orgContentKeys.posts, queryFn: orgPostApi.getMyPosts });

// OB-03 / OB-05: một bài
export const useMyPost = (id) =>
  useQuery({
    queryKey: orgContentKeys.post(id),
    queryFn: () => orgPostApi.getMyPost(id),
    enabled: !!id,
  });

// OB-05: bình luận của một bài (cả bình luận bị ẩn — status REMOVED)
export const usePostComments = (id) =>
  useQuery({
    queryKey: orgContentKeys.comments(id),
    queryFn: () => orgPostApi.getPostComments(id),
    enabled: !!id,
  });

// Ghi xong → làm mới mọi dữ liệu tổ chức (danh sách bài, chi tiết, bình luận)
const useInvalidateOrgContent = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orgContent"] });
};

// Form (photoUris, content, campaignId) → body API. Ảnh mới trong máy upload song song; ảnh cũ là URL giữ nguyên
const isRemote = (uri) => /^https?:\/\//.test(uri);
const toPostBody = async ({ content, photoUris, campaignId }) => ({
  content: content.trim(),
  photoUrls: await Promise.all(
    photoUris.map((uri) =>
      isRemote(uri) ? uri : orgPostApi.uploadPostPhoto(uri),
    ),
  ),
  campaignId: campaignId ?? null,
});

// OB-02
export function useCreatePost() {
  const invalidate = useInvalidateOrgContent();
  return useMutation({
    mutationFn: async (values) =>
      orgPostApi.createPost(await toPostBody(values)),
    onSuccess: invalidate,
  });
}

// OB-03
export function useUpdatePost(id) {
  const invalidate = useInvalidateOrgContent();
  return useMutation({
    mutationFn: async (values) =>
      orgPostApi.updatePost(id, await toPostBody(values)),
    onSuccess: invalidate,
  });
}

// OB-01 ⋯ → Xoá
export function useDeletePost() {
  const invalidate = useInvalidateOrgContent();
  return useMutation({
    mutationFn: (id) => orgPostApi.deletePost(id),
    onSuccess: invalidate,
  });
}
