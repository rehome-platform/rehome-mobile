import { api, unwrap } from "@/lib/api/client";

// Điểm tích lũy (BE PointsController, chỉ role MEMBER, không có /api).
// GET /points và POST /points/redeem cùng trả một hình dạng:
//   { pointsBalance, bonusAiTryonCredits, bonusLiveTryonCredits, vndPerPoint, costPerAiTryon, costPerLiveTryon }
// Các đơn giá (vndPerPoint, costPer…) do Admin chỉnh → luôn hiển thị theo response, không viết cứng.
// vndPerPoint = 0 → đang tắt tích điểm; costPer… = 0 → đang đóng quy đổi loại đó.

export async function getPoints() {
  return unwrap(await api.get("/points"));
}

// type: "AI_TRYON" | "LIVE_TRYON"; quantity 1..100 (BE kiểm lại)
export async function redeemPoints({ type, quantity }) {
  return unwrap(await api.post("/points/redeem", { type, quantity }));
}
