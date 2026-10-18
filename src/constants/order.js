// API 52: BE trả unavailableReason = tên ProductStatus của món khi món không còn ON_SALE (đọc code 19/10)
export const CART_UNAVAILABLE_LABEL = {
  RESERVED: "Đang có người thanh toán",
  SOLD: "Đã bán",
  WITHDRAWN: "Người ký gửi đã rút hàng",
  UNCLAIMED: "Không còn bán",
  DONATED: "Không còn bán",
  DESTROYED: "Không còn bán",
};
export const unavailableLabel = (reason) =>
  CART_UNAVAILABLE_LABEL[reason] ?? "Không còn khả dụng";

export const ADDRESS_LIMIT = 5; // BR-06 — BE không giới hạn → app tự chặn
