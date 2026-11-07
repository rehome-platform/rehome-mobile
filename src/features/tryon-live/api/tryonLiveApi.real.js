import { api, unwrap } from "@/lib/api/client";

// GET /tryon/live/quota
export async function getQuota() {
  return unwrap(await api.get("/tryon/live/quota"));
}

// POST /tryon/live/sessions - trừ quota ngay tại BE, trả client token Decart cho WebView dùng
export async function startSession(productId) {
  return unwrap(await api.post("/tryon/live/sessions", { productId }));
}

// PATCH /tryon/live/sessions/{id}/complete - chỉ dùng khi KHÔNG có video (vd. mất kết nối giữa chừng),
// chỉ để audit, không hoàn quota. Khi có video, trang WebView tự upload và BE tự đánh dấu COMPLETED.
export async function completeSession(sessionId, { status, actualDurationSeconds }) {
  return unwrap(
    await api.patch(`/tryon/live/sessions/${sessionId}/complete`, {
      status,
      actualDurationSeconds,
    }),
  );
}
