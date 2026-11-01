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

// OB-01 ⋯ → Xoá
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => orgPostApi.deletePost(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["orgContent"] }),
  });
}
