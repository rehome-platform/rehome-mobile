import { PRODUCT_STATUS } from "@/constants/consignment";

// Trạng thái hiển thị ở BR-04 (người mua), suy từ ProductStatus của BE
export const SALE_STATE = {
  ON_SALE: "ON_SALE",
  UNAVAILABLE: "UNAVAILABLE", // RESERVED: đã có người đặt — có thể quay lại sàn nếu họ không trả trong 15 phút
  SOLD: "SOLD",
  ENDED: "ENDED", // WITHDRAWN, UNCLAIMED, DONATED, DESTROYED: rời sàn, không phải do bán
};

// null = chưa biết (đang hiện tạm dữ liệu thẻ, chưa tải xong chi tiết)
export const saleStateOf = (status) => {
  if (!status) return null;
  if (status === PRODUCT_STATUS.ON_SALE) return SALE_STATE.ON_SALE;
  if (status === PRODUCT_STATUS.RESERVED) return SALE_STATE.UNAVAILABLE;
  if (status === PRODUCT_STATUS.SOLD) return SALE_STATE.SOLD;
  return SALE_STATE.ENDED;
};
