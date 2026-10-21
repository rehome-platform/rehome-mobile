// Mock ví (API 73–78) "sống" trong RAM, nối với mock đơn: huỷ đơn đã trả → giao dịch Hoàn tiền.
// Field theo entity BE (WalletTransaction, PayoutRequest) + field mobile xin thêm [CHỜ BE]: code, relatedOrderNo,
// payoutId, balanceAfter, productName, commissionRate, termNo. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import {
  TX_STATUS,
  WALLET_LIMITS,
  WALLET_TX_TYPE as T,
} from "@/constants/wallet";
import { ERROR_CODES } from "@/constants/errorCodes";
import { formatVnd } from "@/utils/money";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => dayjs().toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const year = dayjs().year();
// Cùng định dạng mã đơn với ordersApi.mock (đơn mẫu od-seed-9 = OD-<năm>-000009)
const orderNo = (n) => `OD-${year}-${String(n).padStart(6, "0")}`;
const desc = (key) => (a, b) => dayjs(b[key]).diff(a[key]);
const paginate = (items, page, size) => ({
  content: items.slice(page * size, (page + 1) * size).map((i) => ({ ...i })), // bản sao: mock sửa tại chỗ
  page,
  size,
  totalElements: items.length,
  totalPages: Math.ceil(items.length / size),
});

let wallet = { balance: 1284000, lockedBalance: 500000 };
let emptyMode = false; // [DEV] xem màn ví rỗng

let seq = 0;
const tx = (type, amount, extra = {}) => {
  seq += 1;
  return {
    id: `tx-${seq}`,
    code: `GD-${year}-${String(4100 + seq).padStart(6, "0")}`, // [CHỜ BE] mã hiển thị
    type,
    amount,
    status: TX_STATUS.SUCCESS,
    relatedOrderId: null,
    relatedOrderNo: null, // [CHỜ BE]
    payoutId: null, // [CHỜ BE] với giao dịch Rút tiền
    note: null,
    balanceAfter: null, // [CHỜ BE]
    createdAt: nowIso(),
    ...extra,
  };
};

let transactions = [
  tx(T.ORDER_PAYOUT, 612000, {
    relatedOrderId: "sold-231",
    relatedOrderNo: orderNo(231),
    note: "Váy hoa nhí",
    balanceAfter: 1284000,
    createdAt: ago(1, "day"),
  }),
  tx(T.WITHDRAWAL, -500000, {
    status: TX_STATUS.PROCESSING,
    payoutId: "po-88",
    note: "Yêu cầu RT-00088",
    createdAt: ago(30, "hour"),
  }),
  tx(T.REFUND, 545000, {
    relatedOrderId: "od-seed-9", // đơn huỷ mẫu trong ordersApi.mock
    relatedOrderNo: orderNo(9),
    note: "Hoàn tiền huỷ đơn",
    createdAt: ago(229, "hour"),
  }),
  tx(T.WITHDRAWAL_FEE, -50000, {
    note: "SKU Q7-AK-000845",
    createdAt: ago(10, "day"),
  }),
  tx(T.ORDER_PAYOUT, 357000, {
    relatedOrderId: "sold-219",
    relatedOrderNo: orderNo(219),
    note: "Áo sơ mi linen",
    createdAt: ago(14, "day"),
  }),
  tx(T.ORDER_PAYOUT, 704000, {
    relatedOrderId: "sold-204",
    relatedOrderNo: orderNo(204),
    note: "Áo khoác gió",
    createdAt: ago(21, "day"),
  }),
];

// API 75: mỗi đơn đã bán (người bán) — hoa hồng theo kỳ LÚC ĐẶT đơn (OrderItem.commissionRateApplied)
const rev = (
  orderId,
  n,
  productName,
  salePrice,
  commissionRate,
  termNo,
  daysAgo,
) => {
  const commission = Math.round(salePrice * commissionRate);
  const tax = 0; // BE: thuế tạm 0
  return {
    orderId,
    orderNo: orderNo(n),
    productName, // [CHỜ BE câu 15]
    salePrice,
    commissionRate, // [CHỜ BE câu 15]
    termNo, // [CHỜ BE câu 15]
    commission,
    tax,
    netAmount: salePrice - commission - tax,
    completedAt: ago(daysAgo, "day"),
  };
};
let revenue = [
  rev("sold-231", 231, "Váy hoa nhí", 680000, 0.1, 1, 1),
  rev("sold-219", 219, "Áo sơ mi linen", 420000, 0.15, 2, 14),
  rev("sold-204", 204, "Áo khoác gió", 880000, 0.2, 3, 21),
];

// API 77/78 (nhánh 4 thêm tạo yêu cầu rút)
let payouts = [
  {
    id: "po-88",
    code: "RT-00088", // [CHỜ BE] mã hiển thị
    amount: 500000,
    status: TX_STATUS.PROCESSING,
    failureReason: null,
    createdAt: ago(30, "hour"),
    processedAt: null,
  },
];

export async function getWallet() {
  await delay();
  if (emptyMode) return { balance: 0, lockedBalance: 0, availableBalance: 0 };
  return { ...wallet, availableBalance: wallet.balance - wallet.lockedBalance };
}

export async function getTransactions({
  direction,
  type,
  page = 0,
  size = 20,
} = {}) {
  await delay();
  if (emptyMode) return paginate([], page, size);
  const list = transactions
    .filter((t) => !type || t.type === type)
    .filter(
      (t) =>
        !direction ||
        direction === "ALL" ||
        (direction === "IN" ? t.amount > 0 : t.amount < 0),
    )
    .sort(desc("createdAt"));
  return paginate(list, page, size);
}

export async function getRevenue({ page = 0, size = 20 } = {}) {
  await delay();
  return paginate(
    emptyMode ? [] : [...revenue].sort(desc("completedAt")),
    page,
    size,
  );
}

export async function getPayouts({ page = 0, size = 20 } = {}) {
  await delay();
  return paginate(
    emptyMode ? [] : [...payouts].sort(desc("createdAt")),
    page,
    size,
  );
}

export async function getPayout(id) {
  await delay();
  const p = payouts.find((x) => x.id === id);
  if (!p)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy yêu cầu rút.",
    });
  return { ...p };
}

// [MOCK] ordersApi.mock gọi khi huỷ đơn đã thanh toán, returnsApi.mock gọi khi trả hàng hợp lệ / thất lạc: hoàn 100% vào ví
export function mockRefund({
  orderId,
  orderNo: no,
  amount,
  note = "Hoàn tiền huỷ đơn",
}) {
  wallet.balance += amount;
  transactions.push(
    tx(T.REFUND, amount, {
      relatedOrderId: orderId,
      relatedOrderNo: no,
      note,
      balanceAfter: wallet.balance,
    }),
  );
}

// [DEV] bật / tắt màn ví rỗng (người dùng mới)
export function mockSetEmpty(value) {
  emptyMode = value;
}
export const mockIsEmpty = () => emptyMode;
// ---------- Nhánh 4: rút tiền ----------
let failNextPayout = false;
// [DEV] lần rút kế tiếp sẽ thất bại (test VI-05 Thất bại)
export const mockNextPayoutFails = () => {
  failNextPayout = true;
};

const conflict = (code, message) =>
  new ApiError({ status: 409, code, message });
const payoutsToday = () =>
  payouts.filter((p) => dayjs(p.createdAt).isSame(dayjs(), "day")).length;

export async function getWalletConfig() {
  await delay(300);
  return {
    minPayout: WALLET_LIMITS.MIN_PAYOUT,
    maxPayoutsPerDay: WALLET_LIMITS.MAX_PAYOUTS_PER_DAY,
    usedToday: payoutsToday(),
  };
}

// Như BE: kiểm tối thiểu / khả dụng / lượt trong ngày → PENDING, KHOÁ tiền ngay.
// Giả lập chi tiền: ~2 giây PROCESSING, ~6 giây SUCCESS (trừ số dư) hoặc FAILED (nhả khoá)
export async function createPayout(amount) {
  await delay(700);
  const available = wallet.balance - wallet.lockedBalance;
  if (!amount || amount < WALLET_LIMITS.MIN_PAYOUT) {
    throw conflict(
      ERROR_CODES.BELOW_MIN_PAYOUT,
      `Số tiền rút tối thiểu là ${formatVnd(WALLET_LIMITS.MIN_PAYOUT)}.`,
    );
  }
  if (amount > available) {
    throw conflict(
      ERROR_CODES.INSUFFICIENT_BALANCE,
      "Số dư khả dụng không đủ.",
    );
  }
  if (payoutsToday() >= WALLET_LIMITS.MAX_PAYOUTS_PER_DAY) {
    throw conflict(
      ERROR_CODES.DAILY_PAYOUT_LIMIT_REACHED,
      "Bạn đã hết lượt rút tiền hôm nay.",
    );
  }

  const no = 88 + payouts.length;
  const p = {
    id: `po-${no}`,
    code: `RT-${String(no).padStart(5, "0")}`,
    amount,
    status: TX_STATUS.PENDING,
    failureReason: null,
    createdAt: nowIso(),
    processedAt: null,
  };
  payouts.push(p);
  wallet.lockedBalance += amount;
  const t = tx(T.WITHDRAWAL, -amount, {
    status: TX_STATUS.PENDING,
    payoutId: p.id,
    note: `Yêu cầu ${p.code}`,
  });
  transactions.push(t);

  const willFail = failNextPayout;
  failNextPayout = false;
  setTimeout(() => {
    p.status = TX_STATUS.PROCESSING;
    t.status = TX_STATUS.PROCESSING;
  }, 2000);
  setTimeout(() => {
    p.processedAt = nowIso();
    wallet.lockedBalance -= amount; // nhả khoá dù thành công hay thất bại
    if (willFail) {
      p.status = TX_STATUS.FAILED;
      p.failureReason =
        "Cổng chi tiền từ chối giao dịch. Đây là lỗi phía hệ thống, không phải do tài khoản của bạn.";
      t.status = TX_STATUS.FAILED;
    } else {
      p.status = TX_STATUS.SUCCESS;
      wallet.balance -= amount;
      t.status = TX_STATUS.SUCCESS;
      t.balanceAfter = wallet.balance;
    }
  }, 6000);

  return { id: p.id, amount, status: p.status };
}
// [MOCK] paymentApi.mock gọi khi trả đơn bằng ví: đủ khả dụng thì trừ số dư,
// mỗi đơn một giao dịch "Thanh toán đơn hàng" (âm). Thiếu → 409 INSUFFICIENT_BALANCE (như contract API 60)
export function mockPayWithWallet(orders) {
  const total = orders.reduce((s, o) => s + o.totalAmount, 0);
  if (total > wallet.balance - wallet.lockedBalance) {
    throw conflict(
      ERROR_CODES.INSUFFICIENT_BALANCE,
      "Số dư ví không đủ để thanh toán.",
    );
  }
  orders.forEach((o) => {
    wallet.balance -= o.totalAmount;
    transactions.push(
      tx(T.ORDER_PAYMENT, -o.totalAmount, {
        relatedOrderId: o.id,
        relatedOrderNo: o.orderNo,
        note: "Thanh toán đơn hàng",
        balanceAfter: wallet.balance,
      }),
    );
  });
}
// ---------- Phase 5 ----------
// withdrawalApi.mock dùng: số dư khả dụng để chia phí (ví trước, thiếu MoMo)
export const mockAvailableBalance = () =>
  emptyMode ? 0 : wallet.balance - wallet.lockedBalance;

// Trừ phần phí rút hàng trả bằng ví → giao dịch WITHDRAWAL_FEE (âm)
export function mockChargeWithdrawalFee({ amount, note }) {
  if (amount > mockAvailableBalance()) {
    throw conflict(
      ERROR_CODES.INSUFFICIENT_BALANCE,
      "Số dư ví không đủ để trả phí rút hàng.",
    );
  }
  wallet.balance -= amount;
  transactions.push(
    tx(T.WITHDRAWAL_FEE, -amount, { note, balanceAfter: wallet.balance }),
  );
}
