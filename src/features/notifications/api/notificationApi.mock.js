// Mock thông báo (API 114–116) trong RAM. Các mock khác gọi mockNotify(...) khi có sự kiện
// (đơn đổi trạng thái, hoàn tiền, rút tiền, trả hàng, rút hàng) → chuông có thông báo như app thật.
// Field theo entity Notification của BE (a0c6abe: type, title, body, isRead, createdAt)
// + targetType/targetId [CHỜ BE PHASE6_GUIDE câu 17]. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import {
  NOTIFICATION_TARGET as T,
  NOTIFICATION_TYPE as N,
} from "@/constants/notification";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const ago = (n, unit) => dayjs().subtract(n, unit).toISOString();

let seq = 0;
let items = [];

const add = (
  type,
  title,
  body,
  targetType,
  targetId,
  createdAt,
  isRead = false,
) => {
  seq += 1;
  items.push({
    id: `nt-${seq}`,
    type,
    title,
    body,
    isRead,
    createdAt,
    targetType: targetType ?? null,
    targetId: targetId ?? null,
  });
};

// ---------- Dữ liệu mẫu (khớp id ở các mock khác) ----------
add(
  N.ORDER_UPDATE,
  "Đơn đang được giao",
  "Đơn Áo len cổ lọ đã rời kho, GHN dự kiến giao ngày mai.",
  T.ORDER,
  "od-seed-4",
  ago(40, "minute"),
);
add(
  N.ORDER_UPDATE,
  "Yêu cầu trả hàng đã được duyệt",
  "Kho đã duyệt yêu cầu trả Áo khoác dạ dài. Giao hàng cho shipper trong 3 ngày.",
  T.RETURN_REQUEST,
  "rr-seed-2",
  ago(10, "hour"),
);
add(
  N.TERM_EXPIRY,
  "Kỳ ký gửi sắp hết",
  "Quần jeans ống rộng còn 4 ngày là hết kỳ cuối. Bạn có thể giảm giá để bán nhanh hơn.",
  T.PRODUCT,
  "Q1-QJ-000712",
  ago(1, "day"),
  true,
);
add(
  N.WALLET_EVENT,
  "Đã hoàn tiền vào ví",
  "Đơn Áo khoác jean đã huỷ, 545.000 đ đã hoàn vào ví ReHome.",
  T.WALLET,
  null,
  ago(9, "day"),
  true,
);
add(
  N.WALLET_EVENT,
  "Yêu cầu rút tiền đang xử lý",
  "Yêu cầu RT-00088 đang được chuyển tới tài khoản ngân hàng của bạn.",
  T.PAYOUT,
  "po-88",
  ago(30, "hour"),
  true,
);

// ---------- API 114 ---------- mới nhất trước
export async function getNotifications({ page = 0, size = 20 } = {}) {
  await delay();
  const list = [...items]
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))
    .map((n) => ({ ...n }));
  return {
    content: list.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
  };
}

// [CHỜ BE câu 17] số chưa đọc cho chuông
export async function getUnreadCount() {
  await delay(150);
  return { count: items.filter((n) => !n.isRead).length };
}

// ---------- API 115 ----------
export async function markRead(id) {
  await delay(150);
  const n = items.find((x) => x.id === id);
  if (!n)
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy thông báo.",
    });
  n.isRead = true;
  return null;
}

// ---------- API 116 ----------
export async function markAllRead() {
  await delay();
  items.forEach((n) => {
    n.isRead = true;
  });
  return null;
}

// [MOCK] các mock khác gọi khi có sự kiện → thông báo mới, chưa đọc
export function mockNotify({ type, title, body, targetType, targetId }) {
  add(type, title, body, targetType, targetId, dayjs().toISOString());
}
