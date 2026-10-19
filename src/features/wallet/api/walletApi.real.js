import { api, unwrap } from "@/lib/api/client";

// API 73–78 theo API_CONTRACT [CHỜ BE] — BE chưa có controller ví (đọc code 20/10)

export async function getWallet() {
  return unwrap(await api.get("/wallet")); // {balance, lockedBalance, availableBalance}
}

// direction: "IN" | "OUT" [CHỜ BE câu 13 — contract chỉ lọc theo type]; app vẫn tự lọc theo dấu cho chắc
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
  return unwrap(await api.get("/wallet/transactions", { params }));
}

export async function getRevenue({ page = 0, size = 20 } = {}) {
  return unwrap(await api.get("/wallet/revenue", { params: { page, size } }));
}

export async function getPayouts({ page = 0, size = 20 } = {}) {
  return unwrap(
    await api.get("/wallet/payout-requests", { params: { page, size } }),
  );
}

export async function getPayout(id) {
  return unwrap(await api.get(`/wallet/payout-requests/${id}`));
}
