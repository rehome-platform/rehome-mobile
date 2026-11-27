import * as ExpoLinking from "expo-linking";
import { api, unwrap } from "@/lib/api/client";

// ===== ReHome gửi lại hàng trả không hợp lệ — người mua trả phí GHN trước (đặc tả 27/11, [CHỜ BE]) =====
// BE trả thêm trong ReturnRequestResponse: shipBackStatus, shipBackFee, shipBackFeeDeadline, shipBackPaidAt,
// shipBackPaymentMethod, shipBackTrackingCode, shipBackShippedAt, shipBackDeliveredAt, shipBackFailedAt,
// shipBackRecipientName, shipBackPhone, shipBackAddressDetail → màn hình đọc thẳng, không cần ghép.
// ret: yêu cầu trả (chi tiết) · address: địa chỉ trong sổ địa chỉ của người mua

// Báo phí GHN từ địa điểm đang giữ hàng tới địa chỉ chọn → { fee }
export async function getShipBackQuote({ ret, address }) {
  const q = unwrap(
    await api.get(`/return-requests/${ret.id}/ship-back-quote`, {
      params: { addressId: address.id },
    }),
  );
  return { fee: Number(q.fee) };
}

// API 82 với SHIP_BACK: BE chốt phí theo địa chỉ, đặt hạn trả phí (shipBackFeeDeadline)
export async function chooseShipBack({ ret, address }) {
  return unwrap(
    await api.post(`/return-requests/${ret.id}/invalid-choice`, {
      choice: "SHIP_BACK",
      addressId: address.id,
    }),
  );
}

// Trả phí: WALLET → { paid: true } (trừ ví ngay) · VNPAY → { payUrl } (IPN về thì shipBackStatus = PAID).
// redirectUrl: trả VNPay xong cổng mở lại đúng màn yêu cầu trả hàng trong app (BE F150: không bắt buộc)
export async function payShipBack({ ret, method }) {
  const res = unwrap(
    await api.post(`/return-requests/${ret.id}/ship-back/pay`, {
      method,
      redirectUrl:
        method === "VNPAY"
          ? ExpoLinking.createURL(`returns/${ret.id}`)
          : undefined,
    }),
  );
  return { paid: !!res?.paid, payUrl: res?.payUrl ?? null };
}

// Nhờ BE hỏi lại VNPay (khi IPN chưa về) → { paid, shipBackStatus, amount, paidAt }. Lỗi thì bỏ qua
export async function syncShipBackPayment(id) {
  return unwrap(await api.get(`/return-requests/${id}/ship-back/payment-status`));
}
