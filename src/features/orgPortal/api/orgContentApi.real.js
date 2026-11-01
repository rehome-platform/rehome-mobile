import { ApiError } from "@/lib/api/errors";

// [CHỜ BE] BE (25d8c85) có /campaigns nhưng theo mô hình cũ (chưa có title, coverUrl, receiveAtOwnAddress,
// warehouseIds) và chưa có API đơn chờ lấy / note quyên góp → tạm báo lỗi. BE xong thì viết thật tại đây,
// cùng tên hàm và hình dạng dữ liệu với orgContentApi.mock.js
const notReady = async () => {
  throw new ApiError({
    status: 501,
    code: "HTTP_501",
    message: "Chức năng này đang chờ máy chủ cập nhật.",
  });
};

export const getMyCampaigns = notReady;
export const getMyCampaign = notReady;
export const createCampaign = notReady;
export const updateCampaign = notReady;
export const closeCampaign = notReady;
export const getDonations = notReady;
export const createDonationNote = notReady;
