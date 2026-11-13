import dayjs from "dayjs";
import { api, unwrap } from "@/lib/api/client";

// Quyên góp món ký gửi (BE 1a27081, theo đặc tả 11/11)
// - GET /warehouses/{id}/campaigns?page&size (MEMBER, MODERATOR): BE đã lọc OPEN, chưa hết hạn, không HIDDEN,
//   có nhận đồ tại địa điểm này → trang { content[{ id, title, coverUrl, endTime, preferredItemTypes[],
//   organizationId, organizationName, organizationLogoUrl }], page, size, totalElements, totalPages }
// - POST /products/{id}/donate { campaignId, isAnonymous }
//   → { productId, productStatus: "DONATED", donationId, campaignId, campaignTitle, organizationName }

const BIG_PAGE = 50; // BE tối đa 50 / trang — một địa điểm không có nhiều chiến dịch đến vậy

// Tên field BE → hình dạng màn đang dùng (giống chiến dịch ở cộng đồng: organization.displayName)
const toCampaign = (c) => ({
  ...c,
  organization: {
    id: c.organizationId,
    displayName: c.organizationName,
    logoUrl: c.organizationLogoUrl,
  },
});

export async function getCampaignsAtWarehouse(warehouseId) {
  const page = unwrap(
    await api.get(`/warehouses/${warehouseId}/campaigns`, {
      params: { page: 0, size: BIG_PAGE },
    }),
  );
  return (page?.content ?? [])
    .map(toCampaign)
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
