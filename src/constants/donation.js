// Lượt quyên góp Moderator ghi nhận tại kho (API 150–153, sau Review 2) [CHỜ BE tên enum]
export const DONATION_STATUS = {
  PENDING_PICKUP: "PENDING_PICKUP", // đồ đang nằm ở kho, chờ tổ chức tới lấy
  HANDED_OVER: "HANDED_OVER", // đã bàn giao cho tổ chức
  // [CHỜ BE — đặc tả 17/11] chiến dịch bị ẩn / tổ chức bị khoá → ReHome tạm giữ, Moderator chuyển sang chiến dịch khác.
  // Không bàn giao được cho tổ chức cũ
  ON_HOLD: "ON_HOLD",
};
export const DONATION_STATUS_LABEL = {
  PENDING_PICKUP: "Chờ lấy",
  HANDED_OVER: "Đã bàn giao",
  ON_HOLD: "Tạm giữ",
};
// enum DonationSource (BE 1a27081): DIRECT = Moderator ghi nhận tại quầy · CONSIGNED_ITEM = Member quyên góp món
// đang ký gửi (kèm product { id, name, sku, photoUrl })
export const DONATION_SOURCE = {
  DIRECT: "DIRECT",
  CONSIGNED_ITEM: "CONSIGNED_ITEM",
};

// Note quyên góp tại địa chỉ riêng (OC-08, API 154) [GIẢ ĐỊNH]
export const DONATION_NOTE_LIMITS = { NOTE_MAX: 500, DONOR_NAME_MAX: 100 };

// Form chiến dịch (OC-02 / OC-04) [GIẢ ĐỊNH tới khi BE chốt]
export const CAMPAIGN_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 20,
  DESCRIPTION_MAX: 2000,
};
