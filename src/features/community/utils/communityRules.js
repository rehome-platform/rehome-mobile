import { daysLeft } from "@/utils/consignment";
import { CAMPAIGN_STATUS, REPORT_REASONS } from "@/constants/community";

// MỌI quy tắc hiển thị cộng đồng đặt ở đây. Màn hình chỉ gọi hàm.

// Tên chiến dịch: BE chưa có title (0.5 A16) → dòng đầu mô tả, tối đa 60 ký tự
export const campaignTitleOf = (c) => {
  if (c?.title) return c.title;
  const first = (c?.description ?? "").split("\n")[0].trim();
  return first.length > 60 ? `${first.slice(0, 57)}…` : first;
};

export const isCampaignOpen = (c) => c?.status === CAMPAIGN_STATUS.OPEN;

// "Còn n ngày" tới hết hạn nhận đồ (âm = đã quá)
export const campaignDaysLeft = (c) => daysLeft(c.endTime);

// "Quỹ từ thiện · Toàn quốc"
export const orgSubtitle = (org) =>
  [org?.orgTypeLabel, org?.operationScopeLabel].filter(Boolean).join(" · ");

// "4,1 km" (dấu phẩy thập phân kiểu Việt)
export const formatKm = (km) =>
  km == null ? "" : `${km.toFixed(1).replace(".", ",")} km`;

// Báo cáo: gửi BE một chuỗi reason = "<lý do>: <mô tả>" (0.5 A20). "Lý do khác" bắt buộc mô tả
export const buildReportReason = (key, detail) => {
  const label = REPORT_REASONS.find((r) => r.key === key)?.label ?? "";
  return detail?.trim() ? `${label}: ${detail.trim()}` : label;
};

// Link Google Maps theo toạ độ (có) hoặc địa chỉ
export const mapsUrl = ({ latitude, longitude, address }) =>
  latitude != null && longitude != null
    ? `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    : `geo:0,0?q=${encodeURIComponent(address ?? "")}`;
