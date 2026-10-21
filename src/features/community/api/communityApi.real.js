import { api, unwrap } from "@/lib/api/client";

// ===== Phase 6 [CHỜ BE] — theo API_CONTRACT, BE a0c6abe mới có entity, chưa có controller =====

export const getOrganization = async (id) =>
  unwrap(await api.get(`/organizations/${id}`)); // API 100

export const getNearbyOrganizations = async ({ lat, lng }) =>
  unwrap(await api.get("/organizations/nearby", { params: { lat, lng } })); // API 101

// [CHỜ BE câu 9] chưa có trong contract
export const getOrgCampaigns = async (orgId) =>
  unwrap(await api.get(`/organizations/${orgId}/campaigns`));

export const getCampaign = async (id) =>
  unwrap(await api.get(`/campaigns/${id}`)); // API 102

// [CHỜ BE câu 9] chưa có trong contract
export const getOpenCampaigns = async ({ page = 0, size = 20 } = {}) =>
  unwrap(
    await api.get("/campaigns", { params: { status: "OPEN", page, size } }),
  );

export const follow = async (orgId) =>
  unwrap(await api.post(`/organizations/${orgId}/follow`)); // API 103
export const unfollow = async (orgId) =>
  unwrap(await api.delete(`/organizations/${orgId}/follow`));

// [CHỜ BE câu 14] chưa có trong contract
export const getMyFollowing = async () =>
  unwrap(await api.get("/organizations/following"));

// API 104. [CHỜ BE câu 8] scope ALL — tạm gửi scope; FOLLOWING = bỏ trống organizationId
export const getPosts = async ({
  scope,
  organizationId,
  page = 0,
  size = 10,
} = {}) =>
  unwrap(
    await api.get("/posts", {
      params: {
        ...(organizationId ? { organizationId } : { scope }),
        page,
        size,
      },
    }),
  );

export const getPost = async (id) => unwrap(await api.get(`/posts/${id}`)); // API 105

export const like = async (postId) =>
  unwrap(await api.post(`/posts/${postId}/like`)); // API 106
export const unlike = async (postId) =>
  unwrap(await api.delete(`/posts/${postId}/like`));

export const getComments = async (postId, { page = 0, size = 20 } = {}) =>
  unwrap(
    await api.get(`/posts/${postId}/comments`, { params: { page, size } }),
  ); // API 107

export const addComment = async (postId, content) =>
  unwrap(await api.post(`/posts/${postId}/comments`, { content })); // API 108

export const report = async ({ targetType, targetId, reason }) =>
  unwrap(
    await api.post("/violation-reports", { targetType, targetId, reason }),
  ); // API 109
