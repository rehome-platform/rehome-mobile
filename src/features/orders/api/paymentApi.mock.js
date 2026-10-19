// Mock API 60 [CHỜ BE]. MOMO: chưa có MoMo thật → không có payUrl, BR-09 dùng nút Mock.
// WALLET: trừ ví + đơn PAID ngay trong một lần gọi (như contract API 60)
import { ApiError } from "@/lib/api/errors";
import { PAYMENT_METHOD } from "@/constants/order";
import { mockPayWithWallet } from "@/features/wallet/api/walletApi.mock";
import { mockMarkPaid, mockPendingOrders } from "./ordersApi.mock";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// Nhận MẢNG orderIds (PHASE3_GUIDE 0.4 #6) — màn hình không cần biết BE trả gộp hay từng đơn
export async function startPayment({ orderIds, method = PAYMENT_METHOD.MOMO }) {
  await delay();
  if (!orderIds?.length) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Không có đơn để thanh toán.",
    });
  }
  if (method === PAYMENT_METHOD.WALLET) {
    const pending = mockPendingOrders(orderIds);
    if (!pending.length) {
      throw new ApiError({
        status: 409,
        code: "HTTP_409",
        message: "Đơn không còn chờ thanh toán.",
      });
    }
    mockPayWithWallet(pending); // thiếu số dư → ném 409 INSUFFICIENT_BALANCE
    mockMarkPaid(
      pending.map((o) => o.id),
      PAYMENT_METHOD.WALLET,
    );
    return { paid: true };
  }
  return { payUrl: null };
}

// [DEV] Giả lập MoMo gọi webhook về BE. ok = false → MoMo báo thất bại, đơn vẫn chờ thanh toán
export async function mockPayOrders(orderIds, ok) {
  await delay();
  if (ok) mockMarkPaid(orderIds);
}
