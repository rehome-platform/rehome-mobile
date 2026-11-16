import { PRODUCT_STATUS } from "@/constants/consignment";

// Mock LỆNH quyên góp trong lúc BE chưa có POST /products/{id}/donate. Danh sách chiến dịch dùng bản thật.
// Sản phẩm vẫn là dữ liệu thật của BE → giữ "đã quyên góp" trong RAM rồi đè lên sản phẩm khi đọc
// (applyMockDonation, gọi từ consignmentApi.js). Reload app là mất — chỉ để xem giao diện.
const donated = new Map(); // productId → donation

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function donateProduct(productId, { campaign, isAnonymous }) {
  await delay(600);
  const donation = {
    id: `mock-donation-${productId}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    organizationName: campaign.organization?.displayName ?? null,
    isAnonymous: !!isAnonymous,
    status: "PENDING_PICKUP",
    handedOverAt: null,
  };
  donated.set(productId, donation);
  return {
    productId,
    productStatus: PRODUCT_STATUS.DONATED,
    donationId: donation.id,
    campaignId: donation.campaignId,
    campaignTitle: donation.campaignTitle,
    organizationName: donation.organizationName,
  };
}

export function applyMockDonation(product) {
  const donation = product && donated.get(product.id);
  if (!donation) return product;
  return {
    ...product,
    status: PRODUCT_STATUS.DONATED,
    donation,
    activeWithdrawalId: null,
    withdrawalStatus: null,
    endOfTermDecision: null,
    degradedCase: null,
  };
}
