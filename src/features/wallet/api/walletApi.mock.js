// Mock ví (API 73–78) "sống" trong RAM, nối với mock đơn: huỷ đơn đã trả → giao dịch Hoàn tiền.
// Field theo entity BE (WalletTransaction, PayoutRequest) + field mobile xin thêm [CHỜ BE]: code, relatedOrderNo,
// payoutId, balanceAfter, productName, commissionRate, termNo. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { TX_STATUS, WALLET_TX_TYPE as T } from "@/constants/wallet";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => dayjs().toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const year = dayjs().year();
// Cùng định dạng mã đơn với ordersApi.mock (đơn mẫu od-seed-9 = OD-<năm>-000009)
const orderNo = (n) => `OD-${year}-${String(n).padStart(6, "0")}`;
const desc = (key) => (a, b) => dayjs(b[key]).diff(a[key]);
const paginate = (items, page, size) => ({
  content: items.slice(page * size, (page + 1) * size),
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
  return p;
}

// [MOCK] ordersApi.mock gọi khi huỷ đơn đã thanh toán: hoàn 100% vào ví
export function mockRefund({ orderId, orderNo: no, amount }) {
  wallet.balance += amount;
  transactions.push(
    tx(T.REFUND, amount, {
      relatedOrderId: orderId,
      relatedOrderNo: no,
      note: "Hoàn tiền huỷ đơn",
      balanceAfter: wallet.balance,
    }),
  );
}

// [DEV] bật / tắt màn ví rỗng (người dùng mới)
export function mockSetEmpty(value) {
  emptyMode = value;
}
export const mockIsEmpty = () => emptyMode;
