// Theo enum BE (đọc entity 20/10, khớp): WalletTransactionType, TransactionStatus
export const WALLET_TX_TYPE = {
  ORDER_PAYMENT: "ORDER_PAYMENT", // âm: trả đơn bằng ví
  ORDER_PAYOUT: "ORDER_PAYOUT", // dương: tiền bán món ký gửi
  REFUND: "REFUND", // dương: huỷ đơn / trả hàng hợp lệ / GHN lỗi
  WITHDRAWAL: "WITHDRAWAL", // âm
  WITHDRAWAL_FEE: "WITHDRAWAL_FEE", // âm (Phase 5)
  DEGRADED_COMPENSATION: "DEGRADED_COMPENSATION", // dương (Phase 5)
};

export const WALLET_TX_LABEL = {
  ORDER_PAYMENT: "Thanh toán đơn hàng",
  ORDER_PAYOUT: "Bán hàng",
  REFUND: "Hoàn tiền",
  WITHDRAWAL: "Rút tiền",
  WITHDRAWAL_FEE: "Phí rút lại hàng",
  DEGRADED_COMPENSATION: "Đền bù hàng xuống cấp",
};
export const txLabel = (type) => WALLET_TX_LABEL[type] ?? "Giao dịch khác";

export const TX_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};
export const TX_STATUS_LABEL = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang xử lý",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

// Chip VI-01 (PHASE4_GUIDE 0.4 #8)
export const TX_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "IN", label: "Tiền vào" },
  { value: "OUT", label: "Tiền ra" },
];

// [GIẢ ĐỊNH] theo mục 11 tài liệu tổng quan — chỉ để chặn sớm trên app; BE quyết định cuối
export const WALLET_LIMITS = { MIN_PAYOUT: 10000, MAX_PAYOUTS_PER_DAY: 3 };
