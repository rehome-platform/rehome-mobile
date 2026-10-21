import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { showToast } from "@/utils/toast";
import { FEED_SCOPE } from "@/constants/community";
import { communityApi } from "../api/communityApi";
import { communityKeys } from "../api/queryKeys";

const nextPage = (last) =>
  last.page + 1 < last.totalPages ? last.page + 1 : undefined;
const flatten = (data) => data.pages.flatMap((p) => p.content);

// CD-01 · bài viết theo chip (ALL / FOLLOWING) hoặc của một tổ chức (orgId)
export function useFeed(scope, { orgId, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: orgId ? communityKeys.orgPosts(orgId) : communityKeys.feed(scope),
    queryFn: ({ pageParam }) =>
      communityApi.getPosts({
        scope: scope ?? FEED_SCOPE.ALL,
        organizationId: orgId,
        page: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: flatten,
    enabled,
  });
}

// CD-01 chip Chiến dịch
export function useOpenCampaigns(enabled = true) {
  return useInfiniteQuery({
    queryKey: communityKeys.openCampaigns,
    queryFn: ({ pageParam }) =>
      communityApi.getOpenCampaigns({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: flatten,
    enabled,
  });
}

export function usePost(id) {
  return useQuery({
    queryKey: communityKeys.post(id),
    queryFn: () => communityApi.getPost(id),
    enabled: !!id,
  });
}

export function useComments(postId) {
  return useInfiniteQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: ({ pageParam }) =>
      communityApi.getComments(postId, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    select: flatten,
    enabled: !!postId,
  });
}

// Thích / bỏ thích — LẠC QUAN: đổi số ngay ở bài viết + mọi feed có bài đó; lỗi thì trả lại
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }) =>
      liked ? communityApi.unlike(id) : communityApi.like(id),
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: ["community", "feed"] });
      await qc.cancelQueries({ queryKey: communityKeys.post(id) });
      const patch = (p) =>
        p.id === id
          ? {
              ...p,
              likedByMe: !liked,
              likeCount: p.likeCount + (liked ? -1 : 1),
            }
          : p;
      const prevFeeds = qc.getQueriesData({ queryKey: ["community", "feed"] });
      const prevPost = qc.getQueryData(communityKeys.post(id));
      qc.setQueriesData({ queryKey: ["community", "feed"] }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((pg) => ({
                ...pg,
                content: pg.content.map(patch),
              })),
            }
          : data,
      );
      if (prevPost) qc.setQueryData(communityKeys.post(id), patch(prevPost));
      return { prevFeeds, prevPost };
    },
    onError: (_e, { id }, ctx) => {
      ctx?.prevFeeds?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.prevPost) qc.setQueryData(communityKeys.post(id), ctx.prevPost);
      showToast("Chưa thích được, thử lại sau");
    },
  });
}

// Bình luận: xong tải lại bình luận + số bình luận ở bài và feed
export function useAddComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content) => communityApi.addComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      qc.invalidateQueries({ queryKey: communityKeys.post(postId) });
      qc.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

// Theo dõi / bỏ theo dõi — lạc quan ở hồ sơ tổ chức + bài viết của tổ chức đó
export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, following }) =>
      following ? communityApi.unfollow(orgId) : communityApi.follow(orgId),
    onMutate: ({ orgId, following }) => {
      qc.setQueryData(communityKeys.org(orgId), (o) =>
        o
          ? {
              ...o,
              isFollowing: !following,
              followerCount: (o.followerCount ?? 0) + (following ? -1 : 1),
            }
          : o,
      );
      qc.setQueriesData({ queryKey: ["community", "post"] }, (p) =>
        p?.organizationId === orgId ? { ...p, isFollowing: !following } : p,
      );
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["community"] });
      showToast("Chưa cập nhật được theo dõi, thử lại sau");
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: communityKeys.feed(FEED_SCOPE.FOLLOWING),
      });
      qc.invalidateQueries({ queryKey: communityKeys.following });
    },
  });
}
// CD-03
export function useOrganization(id) {
  return useQuery({
    queryKey: communityKeys.org(id),
    queryFn: () => communityApi.getOrganization(id),
    enabled: !!id,
  });
}

// CD-03 tab Chiến dịch
export function useOrgCampaigns(orgId) {
  return useQuery({
    queryKey: communityKeys.orgCampaigns(orgId),
    queryFn: () => communityApi.getOrgCampaigns(orgId),
    enabled: !!orgId,
  });
}

// CD-04
export function useCampaign(id) {
  return useQuery({
    queryKey: communityKeys.campaign(id),
    queryFn: () => communityApi.getCampaign(id),
    enabled: !!id,
  });
}

// PR-01 "Tổ chức đang theo dõi" [CHỜ BE câu 14]
export function useMyFollowing() {
  return useQuery({
    queryKey: communityKeys.following,
    queryFn: communityApi.getMyFollowing,
  });
}
// CD-05 · chỉ gọi khi đã có toạ độ (API 101 bắt buộc lat/lng)
export function useNearbyOrganizations(coords) {
  return useQuery({
    queryKey: communityKeys.nearby(coords?.lat, coords?.lng),
    queryFn: () => communityApi.getNearbyOrganizations(coords),
    enabled: !!coords?.lat,
  });
}

// CD-06 · gửi báo cáo
export function useReport() {
  return useMutation({
    mutationFn: (body) => communityApi.report(body),
  });
}
