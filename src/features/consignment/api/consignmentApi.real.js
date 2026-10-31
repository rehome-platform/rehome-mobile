import dayjs from "dayjs";
import { api, unwrap } from "@/lib/api/client";

// ===== Ký gửi phía Member (API 14–24) — BE d10db3c =====

// Sản phẩm của tôi (API 21/22) → đúng hình dạng mock mà màn hình đang dùng
// - name: BE gọi là productName
// - endOfTermDeadline: mobile hiểu là hạn KỲ HIỆN TẠI; BE endOfTermDeadline = hạn KỲ CUỐI,
//   hạn kỳ hiện tại là currentTermEndsAt → đổi chỗ, giữ hạn kỳ cuối ở lastDeadline
// - [TẠM] BE chưa trả termLengthDays / maxRenewals / commissionRateTerm1..3 (đã xin BE mục 22)
//   → suy ra từ mốc thời gian và expectedPayout. BE trả đủ thì bỏ phần suy ra
function toProduct(p) {
  const termLengthDays =
    p.termLengthDays ??
    dayjs(p.currentTermEndsAt).diff(dayjs(p.termStartedAt), "day");
  const firstTermStart = dayjs(p.termStartedAt).subtract(
    (p.currentTerm - 1) * termLengthDays,
    "day",
  );
  const maxRenewals =
    p.maxRenewals ??
    Math.round(
      dayjs(p.endOfTermDeadline).diff(firstTermStart, "day") / termLengthDays,
    ) - 1;

  const rates = [
    p.commissionRateTerm1,
    p.commissionRateTerm2,
    p.commissionRateTerm3,
  ];
  // Hoa hồng kỳ hiện tại suy từ tiền dự kiến nhận: payout = giá × (1 − rate)
  if (
    rates[p.currentTerm - 1] == null &&
    p.currentPrice &&
    p.expectedPayout != null
  ) {
    rates[p.currentTerm - 1] =
      Math.round((1 - p.expectedPayout / p.currentPrice) * 100) / 100;
  }

  return {
    ...p,
    name: p.productName,
    termLengthDays,
    maxRenewals,
    commissionRateTerm1: rates[0],
    commissionRateTerm2: rates[1],
    commissionRateTerm3: rates[2],
    endOfTermDeadline: p.currentTermEndsAt ?? p.endOfTermDeadline,
    lastDeadline: p.endOfTermDeadline,
    // BE: order = { id, orderNo, payoutDueAt, payoutAt } — chỉ có khi món SOLD
    order: p.order ? { ...p.order, code: p.order.orderNo } : null,
  };
}

// API 14 — có toạ độ: GET /warehouses/nearest (bắt buộc lat, lng; không có giờ mở cửa).
// Không có vị trí: GET /warehouses (công khai, không bọc result, có openingHours) → distanceKm = null
export async function getNearestWarehouses({ lat, lng } = {}) {
  if (lat == null || lng == null) {
    const list = unwrap(await api.get("/warehouses"));
    return list.map((w) => ({ ...w, distanceKm: null }));
  }
  return unwrap(
    await api.get("/warehouses/nearest", { params: { lat, lng } }),
  );
}

// API 16 — trang { content, page, size, totalElements, totalPages }. Không truyền status thì BE không gồm nháp
export async function getMyForms({ status, page = 0, size = 20 } = {}) {
  return unwrap(
    await api.get("/consignment-forms", { params: { status, page, size } }),
  );
}

// API 17
export async function getForm(id) {
  return unwrap(await api.get(`/consignment-forms/${id}`));
}

// API 15 — 409 TOO_MANY_PENDING_FORMS khi đã đủ yêu cầu chờ duyệt
export async function createForm(payload) {
  return unwrap(await api.post("/consignment-forms", payload));
}

// API 18 — chỉ khi PENDING, không đổi kho. BE ghi đè size / condition theo body → luôn gửi kèm
export async function updateForm(id, payload) {
  return unwrap(await api.put(`/consignment-forms/${id}`, payload));
}

// API 19 — không còn pdfUrl: pdfAvailable + GET /consignment-receipts/{id}/pdf (cần token)
export async function getReceipt(id) {
  return unwrap(await api.get(`/consignment-receipts/${id}`));
}

// API 20 → { id, confirmedAt, pdfAvailable }
export async function confirmReceipt(id) {
  return unwrap(await api.post(`/consignment-receipts/${id}/confirm`));
}

// API 21 — pendingDecision: true = chỉ hàng đang chờ chọn cách xử lý cuối kỳ
export async function getMyProducts({ page = 0, size = 20, pendingDecision } = {}) {
  const res = unwrap(
    await api.get("/products/mine", {
      params: { page, size, pendingDecision },
    }),
  );
  return { ...res, content: res.content.map(toProduct) };
}

// API 22 — có thêm priceChanges, termHistory
export async function getProduct(id) {
  return toProduct(unwrap(await api.get(`/products/mine/${id}`)));
}

// API 23 → { currentPrice }
export async function reducePrice(id, newPrice) {
  return unwrap(
    await api.post(`/products/${id}/price-reduction`, { newPrice }),
  );
}

// API 24 → { decision, newReceiptId }
export async function decideEndOfTerm(decisionId, decision) {
  return unwrap(
    await api.post(`/end-of-term-decisions/${decisionId}/decide`, {
      decision,
    }),
  );
}
