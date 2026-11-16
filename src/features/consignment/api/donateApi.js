// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./donateApi.real";
import * as mock from "./donateApi.mock";

// Còn mock lệnh quyên góp thì CHỈ hiện tính năng ở bản dev — APK phát cho nhóm / demo không thấy nút
// (tránh bấm "quyên góp" mà BE không ghi nhận). BE xong POST /products/{id}/donate → MOCK.donateConsigned = false
export const DONATE_ENABLED = !MOCK.donateConsigned || __DEV__;

export const donateApi = {
  getCampaignsAtWarehouse: real.getCampaignsAtWarehouse,
  // campaign (cả object) chỉ mock cần để dựng tên hiển thị; bản thật chỉ gửi campaignId
  donateProduct: (productId, { campaign, isAnonymous }) =>
    MOCK.donateConsigned
      ? mock.donateProduct(productId, { campaign, isAnonymous })
      : real.donateProduct(productId, {
          campaignId: campaign.id,
          isAnonymous,
        }),
};

// Đè trạng thái "đã quyên góp" (mock) lên sản phẩm thật — no-op khi đã dùng API thật
export const applyMockDonation = MOCK.donateConsigned
  ? mock.applyMockDonation
  : (p) => p;
