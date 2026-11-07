// Thử đồ AI real-time (Decart Lucy VTON). Giá trị khớp enum LiveTryOnStatus của BE.
export const TRYON_LIVE_STATUS = { COMPLETED: "COMPLETED", FAILED: "FAILED" };

// Chỉ dùng khi chưa gọi được GET /tryon/live/quota (ví dụ lần hiện đầu màn hình) — BE luôn là nguồn thật
export const TRYON_LIVE_FALLBACK = { DAILY_LIMIT: 2, MAX_DURATION_SECONDS: 10 };
