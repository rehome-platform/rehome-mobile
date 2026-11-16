// Khoá cache react-query của app tổ chức. invalidate ["orgContent"] → làm mới tất cả
export const orgContentKeys = {
  campaigns: ["orgContent", "campaigns"],
  campaign: (id) => ["orgContent", "campaign", id],
  donations: (campaignId, warehouseId) => [
    "orgContent",
    "donations",
    campaignId,
    warehouseId,
  ],
  donationNotes: (campaignId) => ["orgContent", "donationNotes", campaignId],
  posts: ["orgContent", "posts"],
  post: (id) => ["orgContent", "post", id],
  comments: (postId) => ["orgContent", "comments", postId],
};
