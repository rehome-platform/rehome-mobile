// Mock ca hàng xuống cấp (API 94–95) "sống" trong RAM, nối với mock ký gửi (sản phẩm) và ví (tiền đền).
// Field theo entity DegradedItemCase của BE (2c3b597) + field mobile xin thêm [CHỜ BE PHASE5_GUIDE câu 12, 14].
// Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import {
  DEGRADED_CHOICE as C,
  DEGRADED_LIMITS,
  DEGRADED_STATUS as S,
} from "@/constants/withdrawal";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import { mockPatchProduct } from "@/features/consignment/api/consignmentApi.mock";
import { mockCompensate } from "@/features/wallet/api/walletApi.mock";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => dayjs().toISOString();
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();
const later = (n, unit) => dayjs().add(n, unit).toISOString();
const photo = (seed) => `https://picsum.photos/seed/${seed}/400`;
const conflict = (message) =>
  new ApiError({ status: 409, code: "HTTP_409", message });

const KHO_Q1 = WAREHOUSES[0];

let cases = [
  {
    id: "dg-seed-1",
    productId: "Q1-AB-000419", // = SKU, khớp mockData
    productName: "Áo khoác bomber",
    brandName: "Zara",
    size: "M",
    photoUrl: photo("rh-bomber"),
    warehouseName: KHO_Q1.name,
    warehouseAddress: KHO_Q1.address,
    warehouseOpeningHours: KHO_Q1.openingHours,
    receivedAt: ago(1, "day"), // kho nhận hàng trả về
    description:
      "Thùng bị móp nặng trên đường về kho — khoá kéo gãy và có vết rách ở thân sau.",
    damagePhotoUrls: [photo("dg1a"), photo("dg1b"), photo("dg1c")],
    compensationAmount: 442000, // = giá bán − hoa hồng lẽ ra bạn nhận (API 93)
    degradedCompensationRate: 0.5, // từ biên nhận
    status: S.PENDING_DECISION, // [CHỜ BE] bảng chưa có cột status
    decisionDeadline: later(6, "day"), // [CHỜ BE] hạn chọn
    choice: null,
    paidAmount: null,
    decidedAt: null,
    pickupDeadline: null, // [CHỜ BE] hạn đến kho khi nhận lại hàng
    autoDecided: false, // hệ thống tự chọn vì quá hạn
  },
];

const toView = (c) => ({ ...c, damagePhotoUrls: [...c.damagePhotoUrls] });

// Tiền đền theo lựa chọn — một phần làm tròn xuống đồng
export const amountFor = (c, choice) =>
  choice === C.FULL_COMPENSATION
    ? c.compensationAmount
    : Math.floor(c.compensationAmount * c.degradedCompensationRate);

const apply = (c, choice, auto = false) => {
  c.choice = choice;
  c.status = S.DECIDED;
  c.decidedAt = nowIso();
  c.autoDecided = auto;
  c.paidAmount = amountFor(c, choice);
  c.pickupDeadline =
    choice === C.PARTIAL_WITH_ITEM_BACK
      ? later(DEGRADED_LIMITS.PICKUP_DAYS, "day")
      : null;
  mockCompensate({
    amount: c.paidAmount,
    note: `Đền bù hàng xuống cấp · SKU ${c.productId}`,
  });
  mockPatchProduct(c.productId, {
    degradedCase: {
      id: c.id,
      choice,
      decisionDeadline: c.decisionDeadline,
      pickupDeadline: c.pickupDeadline,
    },
  });
};

// Quá hạn mà chưa chọn → hệ thống mặc định nhận tiền đền (wireframe KG-16) [CHỜ BE + LEAD]
const expireIfLate = (c) => {
  if (c.status === S.PENDING_DECISION && dayjs().isAfter(c.decisionDeadline)) {
    apply(c, C.FULL_COMPENSATION, true);
  }
};

const findCase = (id) => {
  const c = cases.find((x) => x.id === id);
  if (!c)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy ca hàng hỏng.",
    });
  expireIfLate(c);
  return c;
};

// ---------- API 94 ----------
export async function getDegradedCase(id) {
  await delay(400);
  return toView(findCase(id));
}

// [CHỜ BE câu 13] liệt kê ca của mình (dải nhắc ở tab Ký gửi)
export async function getMyDegradedCases({ status } = {}) {
  await delay(300);
  cases.forEach(expireIfLate);
  return cases.filter((c) => !status || c.status === status).map(toView);
}

// ---------- API 95 ----------
export async function decideDegradedCase(id, choice) {
  await delay(700);
  const c = findCase(id);
  if (c.status !== S.PENDING_DECISION)
    throw conflict("Ca này đã được quyết định trước đó.");
  if (!Object.values(C).includes(choice))
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Lựa chọn không hợp lệ.",
    });
  apply(c, choice);
  return { id: c.id, choice: c.choice, paidAmount: c.paidAmount };
}

// ---------- [DEV] khung Mock ----------
export async function mockExpireDecision(id) {
  await delay(300);
  const c = findCase(id);
  c.decisionDeadline = ago(1, "minute");
  expireIfLate(c);
  return toView(c);
}
