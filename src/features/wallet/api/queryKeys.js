// invalidate ["wallet"] → làm mới số dư, lịch sử, doanh thu, yêu cầu rút
export const walletKeys = {
  summary: ["wallet", "summary"],
  transactions: (direction) => ["wallet", "transactions", direction ?? "ALL"],
  revenue: ["wallet", "revenue"],
  payouts: ["wallet", "payouts"],
  payout: (id) => ["wallet", "payout", id],
};
