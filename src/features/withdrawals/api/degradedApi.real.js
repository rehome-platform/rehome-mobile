import { api, unwrap } from "@/lib/api/client";

// ===== Phase 5 [CHỜ BE] — theo API_CONTRACT, BE 2c3b597 mới có entity, chưa có controller =====

// API 94
export async function getDegradedCase(id) {
  return unwrap(await api.get(`/degraded-item-cases/${id}`));
}

// [CHỜ BE câu 13] API liệt kê ca của mình — contract chưa có, tạm đoán đường dẫn
export async function getMyDegradedCases({ status } = {}) {
  const data = unwrap(
    await api.get("/degraded-item-cases", { params: status ? { status } : {} }),
  );
  return data?.content ?? data ?? [];
}

// API 95 → { id, choice, paidAmount }
export async function decideDegradedCase(id, choice) {
  return unwrap(
    await api.post(`/degraded-item-cases/${id}/decide`, { choice }),
  );
}
