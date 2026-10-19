import { api, unwrap } from "@/lib/api/client";
import { WALLET_LIMITS } from "@/constants/wallet";

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
// API 76 — 409: BELOW_MIN_PAYOUT / INSUFFICIENT_BALANCE / DAILY_PAYOUT_LIMIT_REACHED [CHỜ BE đưa vào field code]
export async function createPayout(amount) {
  return unwrap(await api.post("/wallet/payout-requests", { amount })); // {id, amount, status: "PENDING"}
}

// [CHỜ BE câu 16] chưa có API cấu hình ví → dùng mặc định, chưa biết số lượt đã dùng hôm nay
export async function getWalletConfig() {
  return {
    minPayout: WALLET_LIMITS.MIN_PAYOUT,
    maxPayoutsPerDay: WALLET_LIMITS.MAX_PAYOUTS_PER_DAY,
    usedToday: null,
  };
}
