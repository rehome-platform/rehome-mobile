import { api, unwrap } from "@/lib/api/client";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";

// API 93–95 (BE DegradedItemCaseController, 65d8475). Đổi dữ liệu BE về hình dạng màn hình đang dùng (giống mock).
// [CHỜ BE] chi tiết chưa có: tỷ lệ đền khi nhận lại hàng (tạm đọc từ biên nhận của món), ngày nhận hàng về,
// hạn đến lấy lại món, số tiền đã cộng, thời điểm chọn, cờ "hệ thống tự chọn"
const toCase = (c, rate) => ({
  ...c,
  choice: c.decision ?? null,
  damagePhotoUrls: c.photos ?? [],
  description: [c.reason, c.moderatorNote].filter(Boolean).join(". "),
  compensationAmount: Number(c.compensationAmount ?? 0),
  degradedCompensationRate: c.degradedCompensationRate ?? rate ?? null,
  receivedAt: c.receivedAt ?? null,
});

// Tỷ lệ đền khi nhận lại hàng nằm trên biên nhận của món: sản phẩm (receiptId) → biên nhận
async function compensationRateOf(productId) {
  try {
    const product = await consignmentApi.getProduct(productId);
    if (!product.receiptId) return null;
    const receipt = await consignmentApi.getReceipt(product.receiptId);
    return receipt.degradedCompensationRate ?? null;
  } catch {
    return null;
  }
}

// API 94
export async function getDegradedCase(id) {
  const c = unwrap(await api.get(`/degraded-item-cases/${id}`));
  return toCase(c, await compensationRateOf(c.productId));
}

// Các ca của mình (dải nhắc tab Ký gửi). BE trả mảng, lọc ?status=PENDING_DECISION
export async function getMyDegradedCases({ status } = {}) {
  const data = unwrap(
    await api.get("/degraded-item-cases", { params: status ? { status } : {} }),
  );
  return (data?.content ?? data ?? []).map((c) => toCase(c));
}

// API 95 → { id, productId, choice, compensationAmount, paidAmount, decidedAt }
export async function decideDegradedCase(id, choice) {
  return unwrap(
    await api.post(`/degraded-item-cases/${id}/decide`, { choice }),
  );
}
