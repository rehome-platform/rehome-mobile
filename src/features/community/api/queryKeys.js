// invalidate ["community"] → làm mới tất cả
export const communityKeys = {
  feed: (scope) => ["community", "feed", scope],
  orgPosts: (orgId) => ["community", "feed", "org", orgId],
  post: (id) => ["community", "post", id],
  comments: (id) => ["community", "comments", id],
  org: (id) => ["community", "org", id],
  orgCampaigns: (id) => ["community", "orgCampaigns", id],
  campaign: (id) => ["community", "campaign", id],
  openCampaigns: ["community", "openCampaigns"],
  nearby: (lat, lng) => ["community", "nearby", lat, lng],
  following: ["community", "following"],
};
