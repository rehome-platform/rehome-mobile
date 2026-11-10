// enum CampaignStatus của BE (a0c6abe: Campaign.status mặc định OPEN). API 102 ví dụ "ACTIVE" → [KIỂM TRA]
// HIDDEN (BE ee01f91): Moderator ẩn do vi phạm — chỉ tổ chức sở hữu thấy (kèm hiddenReason), Member/Guest nhận 404
export const CAMPAIGN_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  HIDDEN: "HIDDEN",
};
export const CAMPAIGN_STATUS_LABEL = {
  OPEN: "Đang nhận đồ",
  CLOSED: "Đã đóng",
  HIDDEN: "Bị ẩn",
};

// enum ContentStatus của BE (bài viết, bình luận): REMOVED = bị gỡ (tổ chức xoá bài / Moderator ẩn bình luận)
export const CONTENT_STATUS = { VISIBLE: "VISIBLE", REMOVED: "REMOVED" };
// Ai viết bình luận (L9: tổ chức trả lời bình luận trên bài của mình) [CHỜ BE tên field]
export const COMMENT_AUTHOR_TYPE = {
  MEMBER: "MEMBER",
  ORGANIZATION: "ORGANIZATION",
};

// [GIẢ ĐỊNH tới khi BE chốt] — OB-02, mục 11 tài liệu
export const POST_LIMITS = { MAX_CHARS: 2000, MAX_PHOTOS: 5 };
export const COMMENT_LIMITS = { MAX_CHARS: 500 };
// MAX_OPEN_CAMPAIGNS: CHỈ cho orgContentApi.mock — bản thật do Admin cấu hình (BE max_concurrent_campaigns), BE tự chặn 409
export const ORG_LIMITS = { MAX_OPEN_CAMPAIGNS: 3, DESCRIPTION_MAX: 300 };

// Chip tab Cộng đồng (CD-01)
export const FEED_SCOPE = {
  ALL: "ALL",
  FOLLOWING: "FOLLOWING",
  CAMPAIGNS: "CAMPAIGNS",
};

// Báo cáo vi phạm (API 109)
export const REPORT_TARGET = {
  POST: "POST",
  CAMPAIGN: "CAMPAIGN",
  ORGANIZATION_ACCOUNT: "ORGANIZATION_ACCOUNT",
};
export const REPORT_REASONS = [
  { key: "SCAM", label: "Nội dung lừa đảo, kêu gọi tiền sai mục đích" },
  { key: "HATE", label: "Ngôn từ thù ghét hoặc quấy rối" },
  { key: "VIOLENT", label: "Hình ảnh phản cảm, bạo lực" },
  { key: "SPAM", label: "Spam hoặc quảng cáo không liên quan" },
  { key: "IMPERSONATION", label: "Mạo danh tổ chức khác" },
  { key: "OTHER", label: "Lý do khác" }, // bắt buộc mô tả
];

// Loại đồ chiến dịch cần (OC-02 chip gợi ý; BE lưu chuỗi — B3)
export const CAMPAIGN_ITEM_TYPES = [
  "Áo khoác",
  "Áo len",
  "Khăn, mũ",
  "Đồ trẻ em 3–12 tuổi",
  "Quần dài",
  "Giày dép",
  "Chăn, màn",
  "Đồ dùng học tập",
];
