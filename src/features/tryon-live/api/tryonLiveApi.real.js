import { api, unwrap } from "@/lib/api/client";

// GET /tryon/live/quota. BE trả theo gói thành viên:
//   { tier, tierName, limitPerDay (null = không giới hạn), usedToday, remainingToday, limitPerMonth, ...,
//     maxSeconds, canStart (true cả khi hết quota gói mà còn lượt đã đổi bằng điểm), bonusCredits, upsellTier }
// Màn hình dùng chung tên `maxDurationSeconds` với phiên (POST /sessions) nên đổi tên ở đây, giống mock.
export async function getQuota() {
  const q = unwrap(await api.get("/tryon/live/quota"));
  return { ...q, maxDurationSeconds: q.maxSeconds };
}

// POST /tryon/live/sessions - CHƯA trừ lượt, chỉ kiểm còn lượt + trả client token Decart cho WebView.
// 429 TRYON_LIVE_UNCONFIRMED_LIMIT: hôm nay mở quá nhiều phiên mà chưa lên hình (chống lạm dụng)
export async function startSession(productId) {
  return unwrap(await api.post("/tryon/live/sessions", { productId }));
}

// PATCH /tryon/live/sessions/{id}/started - báo khung hình AI đầu tiên đã hiện → BE TRỪ LƯỢT tại đây
// (phiên lỗi trước khi lên hình không mất lượt). Gọi lại nhiều lần vẫn an toàn.
// 429 TRYON_LIVE_QUOTA_EXCEEDED: lượt vừa hết (vd. dùng ở máy khác cùng lúc)
export async function markStarted(sessionId) {
  return unwrap(await api.patch(`/tryon/live/sessions/${sessionId}/started`));
}

// GET /tryon/live/sessions - video đã quay xong của chính Member, mới nhất trước.
// Trang: { content: [{ sessionId, productId, productName, productThumbnailUrl, videoUrl,
//   actualDurationSeconds, createdAt, completedAt }], page, size, totalElements, totalPages }
export async function getHistory({ page = 0, size = 20 } = {}) {
  const p = unwrap(await api.get("/tryon/live/sessions", { params: { page, size } }));
  return { ...p, content: p.content ?? [] };
}

// DELETE /tryon/live/sessions/{id} - Member xoá video đã quay của chính mình (mất khỏi lịch sử, không hoàn lượt).
// 404 khi video không còn / không phải của mình
export async function deleteSession(sessionId) {
  return unwrap(await api.delete(`/tryon/live/sessions/${sessionId}`));
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
