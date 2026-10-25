import { api, unwrap } from "@/lib/api/client";

// API 73–78 + /wallet/config (BE 868d933). Đổi tên field BE về hình dạng màn hình đang dùng (giống mock):
// transactionNo / payoutNo → code; tên món (itemName) → note khi BE không có ghi chú
const toTx = (t) => ({
  ...t,
  code: t.transactionNo,
  note: t.note ?? t.itemName ?? null,
});
const toPayout = (p) => ({ ...p, code: p.payoutNo });
const mapPage = (page, fn) => ({ ...page, content: page.content.map(fn) });

export async function getWallet() {
  return unwrap(await api.get("/wallet")); // {balance, lockedBalance, availableBalance}
}

// direction: "IN" | "OUT" (BE lọc theo dấu); type: tên WalletTransactionType, nhiều loại nối dấu phẩy
export async function getTransactions({
  direction,
  type,
  page = 0,
  size = 20,
} = {}) {
  const params = {
    page,
    size,
    ...(type ? { type } : {}),
    ...(direction && direction !== "ALL" ? { direction } : {}),
  };
  return mapPage(
    unwrap(await api.get("/wallet/transactions", { params })),
    toTx,
  );
}

// month: "yyyy-MM" (không gửi = tất cả)
export async function getRevenue({ month, page = 0, size = 20 } = {}) {
  const params = { page, size, ...(month ? { month } : {}) };
  return unwrap(await api.get("/wallet/revenue", { params }));
}

export async function getPayouts({ page = 0, size = 20 } = {}) {
  return mapPage(
    unwrap(
      await api.get("/wallet/payout-requests", { params: { page, size } }),
    ),
    toPayout,
  );
}

export async function getPayout(id) {
  return toPayout(unwrap(await api.get(`/wallet/payout-requests/${id}`)));
}

// API 76 — 409 code: BELOW_MIN_PAYOUT / INSUFFICIENT_BALANCE / DAILY_PAYOUT_LIMIT_REACHED
export async function createPayout(amount) {
  return toPayout(
    unwrap(await api.post("/wallet/payout-requests", { amount })),
  );
}

// {minPayout, maxPayoutsPerDay, usedToday}
export async function getWalletConfig() {
  return unwrap(await api.get("/wallet/config"));
}
