import dayjs from "dayjs";
import { api, unwrap } from "@/lib/api/client";
import { CAMPAIGN_STATUS } from "@/constants/community";
import { communityApi } from "@/features/community/api/communityApi";

// Quyên góp món ký gửi — theo đặc tả gửi BE 11/11.
// - Chiến dịch nhận đồ tại 1 địa điểm: BE CHƯA có GET /warehouses/{id}/campaigns (đã xin) → tạm lấy mọi chiến dịch
//   đang nhận (GET /campaigns?status=ACTIVE, đã có warehouses[]) rồi lọc trên máy. BE có API thì đổi sang gọi thẳng
// - Lệnh quyên góp: POST /products/{id}/donate { campaignId, isAnonymous }
//   → { productId, productStatus: "DONATED", donationId, campaignId, campaignTitle, organizationName }

const BIG_PAGE = 50; // BE tối đa 50 / trang

export async function getCampaignsAtWarehouse(warehouseId) {
  const page = await communityApi.getOpenCampaigns({ size: BIG_PAGE });
  return (page?.content ?? [])
    .filter(
      (c) =>
        c.status === CAMPAIGN_STATUS.OPEN &&
        dayjs(c.endTime).isAfter(dayjs()) &&
        (c.warehouses ?? []).some((w) => w.id === warehouseId),
    )
    .sort((a, b) => dayjs(a.endTime).diff(b.endTime)); // sắp hết hạn trước
}

export async function donateProduct(productId, { campaignId, isAnonymous }) {
  return unwrap(
    await api.post(`/products/${productId}/donate`, {
      campaignId,
      isAnonymous: !!isAnonymous,
    }),
  );
}
