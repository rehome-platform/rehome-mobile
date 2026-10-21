import { api, unwrap } from "@/lib/api/client";

// ===== Phase 5 [CHỜ BE] — theo API_CONTRACT, BE 2c3b597 mới có entity, chưa có controller =====

// API 90 → { id, feeCharged, status: "PENDING_PICKUP", pickupDeadline }. 409 khi món đã có đơn
export async function createWithdrawal(productId) {
  return unwrap(await api.post("/item-withdrawal-requests", { productId }));
}

// API 91 — ví trước, thiếu MoMo. Đủ: { id, feeCharged, status } · thiếu: { payUrl }
export async function payWithdrawalFee(id) {
  return unwrap(
    await api.post(`/item-withdrawal-requests/${id}/pay-fee`, {
      paymentMethod: "MIXED",
    }),
  );
}

// API 92
export async function getWithdrawal(id) {
  return unwrap(await api.get(`/item-withdrawal-requests/${id}`));
}
