// Lượt quyên góp Moderator ghi nhận tại kho (API 150–153, sau Review 2) [CHỜ BE tên enum]
export const DONATION_STATUS = {
  PENDING_PICKUP: "PENDING_PICKUP", // đồ đang nằm ở kho, chờ tổ chức tới lấy
  HANDED_OVER: "HANDED_OVER", // đã bàn giao cho tổ chức
};
export const DONATION_STATUS_LABEL = {
  PENDING_PICKUP: "Chờ lấy",
  HANDED_OVER: "Đã bàn giao",
};

// Note quyên góp tại địa chỉ riêng (OC-08, API 154) [GIẢ ĐỊNH]
export const DONATION_NOTE_LIMITS = { NOTE_MAX: 500, DONOR_NAME_MAX: 100 };

// Form chiến dịch (OC-02 / OC-04) [GIẢ ĐỊNH tới khi BE chốt]
export const CAMPAIGN_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 20,
  DESCRIPTION_MAX: 2000,
};
