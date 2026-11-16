import { api, unwrap } from "@/lib/api/client";

// Gói thành viên + ví voucher — chỉ có bản THẬT (BE đã có đủ API, develop e812dda). Không có /api ở đầu.
// Màn hình chỉ gọi file này qua hook (useMembership.js).

// §8.1 GET /memberships/plans — PUBLIC, chỉ gói đang bán (không có FREE), xếp theo sortOrder.
// [{ id, tier, name, description, pricePerMonth, pricePerYear, yearlySavingPercent,
//    benefits { liveTryonPerDay, liveTryonPerMonth, liveTryonMaxSeconds, aiTryonPerDay, aiTryonPerMonth,
//               featuredListing, maxPendingConsignmentForms },  — null = không giới hạn
//    vouchers [{ name, type, quantityPerMonth }], sortOrder }]
export async function getPlans() {
  const list = unwrap(await api.get("/memberships/plans")) ?? [];
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// §8.2 GET /memberships/me — luôn 200; chưa mua gói thì tier FREE, subscriptionId null.
// { subscriptionId, tier, tierName, status, billingCycle, startedAt, expiresAt, daysRemaining,
//   quota { liveTryon, aiTryon { limitPerDay, usedToday, remainingToday, limitPerMonth, usedThisMonth,
//           remainingThisMonth, maxSeconds }, featuredListing { enabled, productCount },
//           consignmentForms { limit, pending, remaining } },
//   voucherSummary { unused, expiringSoon },
//   pricePaid?, remainingValue? }  ← [CHỜ BE việc 5] số tiền còn lại khi đổi gói
export async function getMyMembership() {
  return unwrap(await api.get("/memberships/me"));
}

// POST /memberships/subscribe { planId, billingCycle, paymentMethod: WALLET | MOMO | VNPAY, redirectUrl }
// → { subscriptionId, status: ACTIVE | PENDING_PAYMENT, tier, tierName, expiresAt, payUrl, vouchersIssued,
//     replacedTier }. Ví: kích hoạt ngay. MoMo/VNPay: trả payUrl, chờ cổng báo về (BE bắt buộc redirectUrl)
export async function subscribe({ planId, billingCycle, paymentMethod, redirectUrl }) {
  return unwrap(
    await api.post("/memberships/subscribe", {
      planId,
      billingCycle,
      paymentMethod,
      redirectUrl,
    }),
  );
}

// GET /memberships/me/history?page&size → trang { id, subscriptionId, tier, tierName, billingCycle, amount,
//   method, status: SUCCESS | PENDING | FAILED, paidAt, startedAt, expiresAt }
export async function getHistory({ page = 0, size = 20 } = {}) {
  return unwrap(
    await api.get("/memberships/me/history", { params: { page, size } }),
  );
}

// §8.5 GET /vouchers/me?status=UNUSED|USED|EXPIRED&page&size → trang { id, code, name, description, type,
//   discountKind, discountValue, maxDiscountAmount, minOrderAmount, status, issuedAt, expiresAt, daysRemaining,
//   usedAt, usedOrderNos[] }. UNUSED trước, sắp hết hạn lên đầu
export async function getMyVouchers({ status, page = 0, size = 20 } = {}) {
  return unwrap(
    await api.get("/vouchers/me", { params: { status, page, size } }),
  );
}

// §8.6 GET /vouchers/applicable?productIds=a,b&shippingAddressId= → { subtotal, shippingFee, vouchers: [{ id, code,
//   name, description, type, minOrderAmount, expiresAt, applicable, discountAmount, reason }] }.
// BE tự tính số tiền giảm THẬT (trần hoa hồng theo kỳ, trần phí ship) — app KHÔNG tự tính
export async function getApplicableVouchers({ productIds, shippingAddressId }) {
  return unwrap(
    await api.get("/vouchers/applicable", {
      params: { productIds: productIds.join(","), shippingAddressId },
    }),
  );
}
