import { api, unwrap } from "@/lib/api/client";

// ===== Phase 5 [CHỜ BE] — theo API_CONTRACT, BE 2c3b597 mới có entity, chưa có controller =====

// API 79. reason: "<lựa chọn>: <mô tả>" (buildReasonText); photoUrls: URL sau khi upload
export async function createReturn(orderId, { reason, photoUrls }) {
  return unwrap(
    await api.post(`/orders/${orderId}/return-requests`, { reason, photoUrls }),
  );
}

// API 80. [CHỜ BE] lọc nhiều trạng thái — tạm nối dấu phẩy như API 62
export async function getReturns({ statuses = [], page = 0, size = 10 }) {
  const params = {
    page,
    size,
    ...(statuses.length ? { status: statuses.join(",") } : {}),
  };
  return unwrap(await api.get("/return-requests", { params }));
}

export async function getReturn(id) {
  return unwrap(await api.get(`/return-requests/${id}`));
}

// API 81
export async function confirmHandover(id) {
  return unwrap(await api.post(`/return-requests/${id}/handover`));
}

// API 82
export async function chooseInvalidReturn(id, choice) {
  return unwrap(
    await api.post(`/return-requests/${id}/invalid-choice`, { choice }),
  );
}
