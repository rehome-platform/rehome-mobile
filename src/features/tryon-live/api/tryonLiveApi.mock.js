// Mock "sống" trong RAM — chỉ để màn hình/điều hướng chạy được khi chưa bật BE thật.
// KHÔNG mô phỏng được phiên Decart thật (apiKey giả): bật tryonLive=true chỉ kiểm được luồng
// quota/điều hướng, còn camera/stream AI thật phải test với MOCK.tryonLive=false + có Decart key.
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";
import { TRYON_LIVE_FALLBACK } from "@/constants/tryonLive";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let usedToday = 0;
const DAILY_LIMIT = TRYON_LIVE_FALLBACK.DAILY_LIMIT;

export async function getQuota() {
  await delay();
  return {
    dailyLimit: DAILY_LIMIT,
    usedToday,
    remaining: Math.max(0, DAILY_LIMIT - usedToday),
    maxDurationSeconds: TRYON_LIVE_FALLBACK.MAX_DURATION_SECONDS,
  };
}

export async function startSession(productId) {
  await delay();
  if (usedToday >= DAILY_LIMIT) {
    throw new ApiError({
      status: 429,
      code: ERROR_CODES.TRYON_LIVE_QUOTA_EXCEEDED,
      message: "Bạn đã dùng hết lượt thử đồ AI real-time hôm nay.",
    });
  }
  usedToday += 1;
  return {
    sessionId: `mock-session-${Date.now()}`,
    apiKey: "mock-client-token",
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
    modelId: "lucy-vton-3.5",
    garmentImageUrl: `https://picsum.photos/seed/tryon-live-${productId}/600/800`,
    prompt: "Substitute the current top with the garment shown in the reference image.",
    maxDurationSeconds: TRYON_LIVE_FALLBACK.MAX_DURATION_SECONDS,
    remainingToday: Math.max(0, DAILY_LIMIT - usedToday),
  };
}

export async function completeSession() {
  await delay(150);
  return null;
}
