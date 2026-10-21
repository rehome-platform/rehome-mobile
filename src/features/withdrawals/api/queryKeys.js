// invalidate ["withdrawals"] / ["degraded"] → làm mới tất cả của nhóm
export const withdrawalKeys = {
  detail: (id) => ["withdrawals", "detail", id],
  degraded: (id) => ["degraded", "detail", id],
  degradedMine: (status) => ["degraded", "mine", status ?? "ALL"],
};
