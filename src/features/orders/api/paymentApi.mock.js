// Mock API 60 [CHỜ BE]. Chưa có MoMo thật → không có payUrl; BR-09 dùng nút Mock để giả lập kết quả
import { ApiError } from "@/lib/api/errors";
import { mockMarkPaid } from "./ordersApi.mock";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// Nhận MẢNG orderIds (PHASE3_GUIDE 0.4 #6) — màn hình không cần biết BE trả gộp hay từng đơn
export async function startPayment({ orderIds }) {
  await delay();
  if (!orderIds?.length) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Không có đơn để thanh toán.",
    });
  }
  return { payUrl: null };
}

// [DEV] Giả lập MoMo gọi webhook về BE. ok = false → MoMo báo thất bại, đơn vẫn chờ thanh toán
export async function mockPayOrders(orderIds, ok) {
  await delay();
  if (ok) mockMarkPaid(orderIds);
}
