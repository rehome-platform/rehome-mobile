import dayjs from "dayjs";
import { File, Paths } from "expo-file-system";
import { ENV } from "@/config/env";
import { api, unwrap } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { DEGRADED_STATUS, WITHDRAWAL_STATUS } from "@/constants/withdrawal";

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

  const pendingWithdrawal =
    p.withdrawalRequest?.status === WITHDRAWAL_STATUS.PENDING_PICKUP
      ? p.withdrawalRequest
      : null;

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
    // Phase 5 — BE withdrawalRequest { id, status, pickupDeadline } → tên mock đang dùng (đang chờ đến lấy)
    activeWithdrawalId: pendingWithdrawal ? pendingWithdrawal.id : null,
    withdrawalPickupDeadline: pendingWithdrawal?.pickupDeadline ?? null,
    // BE degradedCase { id, status, decisionDeadline, decision } → choice: chưa chọn = null
    degradedCase: p.degradedCase
      ? {
          ...p.degradedCase,
          choice:
            p.degradedCase.decision ??
            (p.degradedCase.status === DEGRADED_STATUS.DECIDED
              ? DEGRADED_STATUS.DECIDED
              : null),
        }
      : null,
  };
}

// API 14 — có toạ độ: GET /warehouses/nearest (bắt buộc lat, lng; không có giờ mở cửa).
// Không có vị trí: GET /warehouses (công khai, không bọc result, có openingHours) → distanceKm = null
export async function getNearestWarehouses({ lat, lng } = {}) {
  if (lat == null || lng == null) {
    const list = unwrap(await api.get("/warehouses"));
    return list.map((w) => ({ ...w, distanceKm: null }));
  }
  return unwrap(await api.get("/warehouses/nearest", { params: { lat, lng } }));
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

// API 19b — PDF nhị phân, cần token → tải về bộ nhớ đệm, trả File để mở / chia sẻ.
// Token hết hạn thì lần tải đầu lỗi → gọi 1 API qua axios cho interceptor làm mới token, tải lại
export async function downloadReceiptPdf(receipt) {
  const download = async () =>
    File.downloadFileAsync(
      `${ENV.API_BASE_URL}/consignment-receipts/${receipt.id}/pdf`,
      new File(Paths.cache, `${receipt.receiptNo ?? receipt.id}.pdf`),
      {
        headers: {
          Authorization: `Bearer ${await tokenStorage.getAccessToken()}`,
        },
        idempotent: true,
      },
    );
  try {
    return await download();
  } catch {
    await api.get(`/consignment-receipts/${receipt.id}`);
    return download();
  }
}

// API 20 → { id, confirmedAt, pdfAvailable }
export async function confirmReceipt(id) {
  return unwrap(await api.post(`/consignment-receipts/${id}/confirm`));
}

// API 21 — pendingDecision: true = chỉ hàng đang chờ chọn cách xử lý cuối kỳ
export async function getMyProducts({
  page = 0,
  size = 20,
  pendingDecision,
} = {}) {
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

// ===== Nháp ký gửi ("Tủ đồ", BE 65d8475): lưu từng món chưa cần kho, rồi chọn kho gửi cả lô =====
// Không tính vào giới hạn 5 yêu cầu chờ duyệt cho tới lúc gửi. Body như API 15 (warehouseId bị bỏ qua)
export async function createDraft(payload) {
  return unwrap(await api.post("/consignment-forms/drafts", payload)); // chi tiết form (status DRAFT)
}

export async function updateDraft(id, payload) {
  return unwrap(await api.put(`/consignment-forms/drafts/${id}`, payload));
}

export async function deleteDraft(id) {
  await api.delete(`/consignment-forms/drafts/${id}`);
}

// Danh sách nháp chỉ có vài trường → tải chi tiết từng nháp (ảnh, danh mục, size, tình trạng…) để mở lại
export async function getDrafts() {
  const page = unwrap(
    await api.get("/consignment-forms", {
      params: { status: "DRAFT", page: 0, size: 20 },
    }),
  );
  return Promise.all(page.content.map((f) => getForm(f.id)));
}

// Gửi nhiều nháp vào 1 kho (tối đa 20). Kết quả TỪNG món: { formId, success, formNo, errorCode, message }
export async function submitDrafts({ warehouseId, formIds }) {
  return unwrap(
    await api.post("/consignment-forms/submit", { warehouseId, formIds }),
  );
}
