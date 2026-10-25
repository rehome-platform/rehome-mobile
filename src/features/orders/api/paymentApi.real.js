import { api, unwrap } from "@/lib/api/client";
import { PAYMENT_METHOD } from "@/constants/order";

// Cổng thanh toán trên BE có tiền tố /api (khác các API đơn hàng)
const GATEWAY_PATH = {
  [PAYMENT_METHOD.MOMO]: "/api/momo",
  [PAYMENT_METHOD.VNPAY]: "/api/vnpay",
};

// Nhận MẢNG orderIds — trả gộp nhiều đơn trong 1 lần
// - WALLET: POST /orders/pay — trừ ví + đơn PAID ngay; thiếu tiền → 409 INSUFFICIENT_BALANCE
// - MOMO / VNPAY: tạo giao dịch → payUrl (trang thanh toán của cổng, sandbox)
//   Không gửi redirectUrl → trả xong cổng về trang kết quả web của BE; người dùng đóng trang là về app
export async function startPayment({ orderIds, method = PAYMENT_METHOD.MOMO }) {
  if (method === PAYMENT_METHOD.WALLET) {
    await api.post("/orders/pay", { orderIds, method: PAYMENT_METHOD.WALLET });
    return { paid: true };
  }
  const { payUrl } = unwrap(
    await api.post(`${GATEWAY_PATH[method]}/create`, { orderIds }),
  );
  return { payUrl };
}

// F-057: BE tự hỏi lại MoMo/VNPay rồi đánh dấu PAID cho CẢ lô đơn trả gộp → hỏi 1 đơn là đủ.
// Không dựa vào IPN (cổng gọi về server có thể chậm / không tới được)
export async function syncStatus({ orderIds, method }) {
  const base = GATEWAY_PATH[method];
  if (!base || !orderIds?.length) return null;
  return unwrap(await api.get(`${base}/status/${orderIds[0]}`));
}
