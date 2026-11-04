import dayjs from "dayjs";
import { CAMPAIGN_STATUS, ORG_LIMITS } from "@/constants/community";

// MỌI quy tắc chiến dịch phía tổ chức (OC-01 → OC-04) đặt ở đây. Màn hình chỉ gọi hàm.
// Quy tắc hiển thị dùng chung với Cộng đồng (tên, còn n ngày…) giữ ở community/utils/communityRules.js

// OC-01: đang nhận lên trước, rồi gần hết hạn trước; đã đóng thì mới đóng trước
export const byCampaignOrder = (a, b) =>
  a.status !== b.status
    ? a.status === CAMPAIGN_STATUS.OPEN
      ? -1
      : 1
    : a.status === CAMPAIGN_STATUS.OPEN
      ? dayjs(a.endTime).diff(b.endTime)
      : dayjs(b.endTime).diff(a.endTime);

// Dòng ngày của chiến dịch đã đóng. BE đóng sớm không đổi endTime, cũng không lưu ngày đóng →
// hạn còn ở tương lai nghĩa là tổ chức đã bấm đóng sớm
export const closedLabel = (c) =>
  dayjs(c.endTime).isAfter(dayjs())
    ? `Đã đóng sớm · hạn cũ ${dayjs(c.endTime).format("DD/MM/YYYY")}`
    : `Đã đóng ${dayjs(c.endTime).format("DD/MM/YYYY")}`;

export const openCampaignCount = (campaigns = []) =>
  campaigns.filter((c) => c.status === CAMPAIGN_STATUS.OPEN).length;

// OC-01: khoá nút "Tạo chiến dịch mới" khi đã đủ chiến dịch đang nhận đồ
export const canCreateCampaign = (campaigns) =>
  openCampaignCount(campaigns) < ORG_LIMITS.MAX_OPEN_CAMPAIGNS;

// OC-04: chiến dịch đã bắt đầu nhận đồ → khoá ngày bắt đầu (B4)
export const isStartLocked = (campaign) =>
  !!campaign && !dayjs(campaign.startTime).isAfter(dayjs(), "day");

// OC-04: kho còn đơn chờ lấy → không bỏ chọn được [GIẢ ĐỊNH — CHỜ LEAD L4]
export const lockedWarehouseIds = (campaign) =>
  (campaign?.warehouses ?? [])
    .filter((w) => w.pendingCount > 0)
    .map((w) => w.id);

// Nơi nhận hợp lệ: ít nhất một trong hai, được chọn cả hai (wireframe OC-02)
export const hasReceivingPlace = ({ receiveAtOwnAddress, warehouseIds }) =>
  receiveAtOwnAddress || warehouseIds.length > 0;

// Giá trị form ↔ dữ liệu API. Form dùng ngày "YYYY-MM-DD"; API dùng mốc thời gian:
// nhận từ đầu ngày bắt đầu tới hết ngày kết thúc ("Hết ngày cuối, chiến dịch tự đóng")
export const campaignToForm = (c) => ({
  title: c?.title ?? "",
  coverUri: c?.coverUrl ?? null,
  description: c?.description ?? "",
  startDate: c ? dayjs(c.startTime).format("YYYY-MM-DD") : "",
  endDate: c ? dayjs(c.endTime).format("YYYY-MM-DD") : "",
  preferredItemTypes: c ? [...c.preferredItemTypes] : [],
  receiveAtOwnAddress: c?.receiveAtOwnAddress ?? false,
  warehouseIds: c ? [...c.warehouseIds] : [],
});

export const formToCampaignBody = (values, coverUrl) => ({
  title: values.title.trim(),
  coverUrl,
  description: values.description.trim(),
  startTime: dayjs(values.startDate).startOf("day").toISOString(),
  endTime: dayjs(values.endDate).endOf("day").toISOString(),
  preferredItemTypes: values.preferredItemTypes,
  receiveAtOwnAddress: values.receiveAtOwnAddress,
  warehouseIds: values.warehouseIds,
});
