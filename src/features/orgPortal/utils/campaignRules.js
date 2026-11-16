import dayjs from "dayjs";
import { CAMPAIGN_STATUS } from "@/constants/community";

// MỌI quy tắc chiến dịch phía tổ chức (OC-01 → OC-04) đặt ở đây. Màn hình chỉ gọi hàm.
// Quy tắc hiển thị dùng chung với Cộng đồng (tên, còn n ngày…) giữ ở community/utils/communityRules.js

// OC-01: đang nhận → bị ẩn → đã đóng; đang nhận thì gần hết hạn trước, còn lại mới hơn trước
const STATUS_RANK = {
  [CAMPAIGN_STATUS.OPEN]: 0,
  [CAMPAIGN_STATUS.HIDDEN]: 1,
  [CAMPAIGN_STATUS.CLOSED]: 2,
};
export const byCampaignOrder = (a, b) =>
  a.status !== b.status
    ? (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
    : a.status === CAMPAIGN_STATUS.OPEN
      ? dayjs(a.endTime).diff(b.endTime)
      : dayjs(b.endTime).diff(a.endTime);

// Moderator ẩn do vi phạm (BE ee01f91): không sửa / đóng / ghi note được, chỉ xem + lý do
export const isCampaignHidden = (c) => c?.status === CAMPAIGN_STATUS.HIDDEN;

// Dòng ngày của chiến dịch đã đóng. BE đóng sớm không đổi endTime, cũng không lưu ngày đóng →
// hạn còn ở tương lai nghĩa là tổ chức đã bấm đóng sớm
export const closedLabel = (c) =>
  dayjs(c.endTime).isAfter(dayjs())
    ? `Đã đóng sớm · hạn cũ ${dayjs(c.endTime).format("DD/MM/YYYY")}`
    : `Đã đóng ${dayjs(c.endTime).format("DD/MM/YYYY")}`;

export const openCampaignCount = (campaigns = []) =>
  campaigns.filter((c) => c.status === CAMPAIGN_STATUS.OPEN).length;

// OC-01: số chiến dịch đang nhận tối đa do Admin cấu hình (BE max_concurrent_campaigns) và BE chưa có API
// cho tổ chức đọc → app KHÔNG tự khoá nút "Tạo chiến dịch mới"; vượt mức thì BE trả 409 CAMPAIGN_LIMIT_REACHED

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
