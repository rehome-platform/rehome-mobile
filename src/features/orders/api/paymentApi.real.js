import { api, unwrap } from "@/lib/api/client";
import { PAYMENT_METHOD } from "@/constants/order";

// Nhận MẢNG orderIds — màn hình không cần biết BE trả gộp hay từng đơn
// - WALLET: POST /orders/pay — trừ ví + đơn PAID ngay trong 1 lần gọi; thiếu tiền → 409 INSUFFICIENT_BALANCE
// - MOMO: [bước 2.3] chưa nối → payUrl null, màn hình báo "chưa nối MoMo thật"
export async function startPayment({ orderIds, method = PAYMENT_METHOD.MOMO }) {
  if (method === PAYMENT_METHOD.WALLET) {
    await api.post("/orders/pay", { orderIds, method: PAYMENT_METHOD.WALLET });
    return { paid: true };
  }
  return { payUrl: null };
}
