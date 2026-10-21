// Mock rút lại hàng ký gửi (API 90–92) "sống" trong RAM, nối với mock ký gửi (sản phẩm) và ví (phí).
// Field theo entity ItemWithdrawalRequest của BE (2c3b597) + field mobile xin thêm [CHỜ BE PHASE5_GUIDE câu 10, 13].
// Yêu cầu CHƯA trả phí: status = null, chưa gỡ sản phẩm [CHỜ BE câu 10]. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";
import { PRODUCT_STATUS } from "@/constants/consignment";
import {
  FEE_PAYMENT_METHOD as M,
  WITHDRAWAL_LIMITS,
  WITHDRAWAL_STATUS as W,
} from "@/constants/withdrawal";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import {
  mockFindMyProduct,
  mockPatchProduct,
} from "@/features/consignment/api/consignmentApi.mock";
import {
  mockAvailableBalance,
  mockChargeWithdrawalFee,
} from "@/features/wallet/api/walletApi.mock";
import { canWithdraw, freeWindowOf, splitFee } from "../utils/withdrawalRules";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => dayjs().toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();

const notFound = () =>
  new ApiError({
    status: 404,
    code: "HTTP_404",
    message: "Không tìm thấy yêu cầu rút hàng.",
  });
const conflict = (code, message) =>
  new ApiError({ status: 409, code, message });

let withdrawals = [];

const toView = (w) => ({ ...w, events: [...w.events] });

const findWithdrawal = (id) => {
  const w = withdrawals.find((x) => x.id === id);
  if (!w) throw notFound();
  expireIfLate(w);
  return w;
};

// Thông tin món + kho để màn hình khỏi gọi thêm [CHỜ BE câu 10: API 92 thiếu]
const snapshot = (p) => {
  const wh = WAREHOUSES.find((x) => x.name === p.warehouseName);
  return {
    productId: p.id, // = SKU
    productName: p.name,
    brandName: p.brandName,
    size: p.size,
    photoUrl: p.photoUrl,
    currentPrice: p.currentPrice,
    warehouseName: p.warehouseName,
    warehouseAddress: wh?.address ?? null,
    warehouseOpeningHours: wh?.openingHours ?? null,
  };
};

// Có hiệu lực (miễn phí / đã trả phí): gỡ khỏi sàn, bắt đầu đếm hạn đến kho
const activate = (w) => {
  const t = nowIso();
  w.status = W.PENDING_PICKUP;
  w.pickupDeadline = later(WITHDRAWAL_LIMITS.PICKUP_DAYS, "day");
  w.events.unshift({ type: "REMOVED", at: t });
  mockPatchProduct(w.productId, {
    activeWithdrawalId: w.id,
    withdrawalPickupDeadline: w.pickupDeadline,
  });
};

// Quá hạn đến kho → huỷ, đăng bán lại, KHÔNG hoàn phí (F-035). BE sẽ có job làm việc này
const expireIfLate = (w) => {
  if (w.status === W.PENDING_PICKUP && dayjs().isAfter(w.pickupDeadline)) {
    w.status = W.EXPIRED;
    w.events.unshift(
      { type: "RELISTED", at: w.pickupDeadline },
      { type: "EXPIRED", at: w.pickupDeadline },
    );
    mockPatchProduct(w.productId, {
      activeWithdrawalId: null,
      withdrawalPickupDeadline: null,
    });
  }
};

const feeNote = (w) => `Phí rút lại hàng · SKU ${w.productId}`;

// ---------- API 90 ----------
export async function createWithdrawal(productId) {
  await delay(700);
  const p = mockFindMyProduct(productId);
  if (!p)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy sản phẩm.",
    });
  if (p.status === PRODUCT_STATUS.RESERVED) {
    throw conflict(
      ERROR_CODES.PRODUCT_ALREADY_ORDERED,
      "Món này vừa có người đặt mua, không rút được nữa.",
    );
  }
  // Đã tạo trước đó nhưng chưa trả phí → dùng lại (không tạo yêu cầu thứ hai)
  const unpaid = withdrawals.find(
    (w) => w.productId === productId && w.status == null,
  );
  if (unpaid) return toView(unpaid);
  if (!canWithdraw(p)) {
    throw conflict("HTTP_409", "Sản phẩm này không rút được lúc này.");
  }
  const fee = freeWindowOf(p).isFree ? 0 : (p.withdrawalFee ?? 0);
  const w = {
    id: `wd-${Date.now()}`,
    ...snapshot(p),
    feeCharged: fee,
    feePaymentMethod: null,
    feeFromWallet: 0, // [CHỜ BE] phần trả bằng ví / MoMo
    feeFromMomo: 0,
    status: null, // chưa có hiệu lực tới khi trả phí xong
    pickupDeadline: null,
    createdAt: nowIso(),
    completedAt: null,
    events: [{ type: "REQUESTED", at: nowIso() }], // mới nhất ở đầu
  };
  withdrawals.push(w);
  if (fee === 0) activate(w);
  return toView(w);
}

// ---------- API 91: MIXED — ví trước, thiếu thì MoMo ----------
// Ví đủ → trừ luôn, trả { paid: true }. Thiếu → CHƯA trừ ví, trả phần cần MoMo (bản thật có payUrl)
export async function payWithdrawalFee(id) {
  await delay();
  const w = findWithdrawal(id);
  if (w.status != null) throw conflict("HTTP_409", "Phí rút hàng đã được trả.");
  const { fromWallet, fromMomo } = splitFee(
    w.feeCharged,
    mockAvailableBalance(),
  );
  if (fromMomo === 0) {
    mockChargeWithdrawalFee({ amount: fromWallet, note: feeNote(w) });
    w.feePaymentMethod = M.WALLET;
    w.feeFromWallet = fromWallet;
    activate(w);
    return { paid: true, ...toView(w) };
  }
  w.pendingSplit = { fromWallet, fromMomo };
  return { paid: false, payUrl: null, fromWallet, fromMomo };
}

// ---------- API 92 ----------
export async function getWithdrawal(id) {
  await delay(400);
  return toView(findWithdrawal(id));
}

// ---------- [DEV] ----------

// Màn KG-14 (mock) bấm "MoMo thành công / thất bại". Thất bại → ví KHÔNG bị trừ, thử lại được
export async function mockMomoResult(id, success) {
  await delay(800);
  const w = findWithdrawal(id);
  const split = w.pendingSplit;
  if (!split || w.status != null) return { paid: w.status != null };
  if (!success) return { paid: false };
  if (split.fromWallet > 0) {
    mockChargeWithdrawalFee({
      amount: split.fromWallet,
      note: `${feeNote(w)} (phần còn lại qua MoMo)`,
    });
  }
  w.feePaymentMethod = split.fromWallet > 0 ? M.MIXED : M.MOMO;
  w.feeFromWallet = split.fromWallet;
  w.feeFromMomo = split.fromMomo;
  w.pendingSplit = null;
  activate(w);
  return { paid: true, ...toView(w) };
}

// Khung Mock KG-15: việc của kho (web Moderator) / job hết hạn
export const MOCK_WITHDRAWAL_ACTIONS = [
  { key: "HAND_OVER", label: "Kho bàn giao tại quầy" },
  { key: "EXPIRE", label: "Quá hạn đến kho" },
];

export async function mockWithdrawalAction(id, key) {
  await delay(300);
  const w = findWithdrawal(id);
  if (w.status !== W.PENDING_PICKUP) {
    throw conflict("HTTP_409", "Không áp dụng cho trạng thái hiện tại.");
  }
  if (key === "HAND_OVER") {
    w.status = W.COMPLETED;
    w.completedAt = nowIso();
    w.events.unshift({ type: "HANDED_OVER", at: w.completedAt });
    mockPatchProduct(w.productId, {
      status: PRODUCT_STATUS.WITHDRAWN,
      activeWithdrawalId: null,
      withdrawalPickupDeadline: null,
    });
  } else if (key === "EXPIRE") {
    w.pickupDeadline = ago(1, "minute");
    expireIfLate(w);
  }
  return toView(w);
}
