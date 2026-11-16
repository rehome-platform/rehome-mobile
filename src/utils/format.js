import dayjs from "dayjs";
// Hiển thị SĐT dễ đọc: "0912345456" → "0912 345 456". Không đúng 10 số thì giữ nguyên
export const formatPhone = (phone) =>
  (phone ?? "").replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
// "Vừa xong" · "12 phút trước" · "3 giờ trước" · "Hôm qua" · "4 ngày trước" · "05/10/2026"
// Dùng cho bài viết, bình luận, chat, thông báo (PHASE6_GUIDE 4.5)
export function formatRelative(at) {
  const t = dayjs(at);
  const now = dayjs();
  const min = now.diff(t, "minute");
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (t.isSame(now, "day")) return `${now.diff(t, "hour")} giờ trước`;
  if (t.isSame(now.subtract(1, "day"), "day")) return "Hôm qua";
  const days = now.startOf("day").diff(t.startOf("day"), "day");
  if (days < 7) return `${days} ngày trước`;
  return t.format("DD/MM/YYYY");
}
// Địa chỉ đầy đủ: "12 Lê Lợi, Phường Bến Thành, Hồ Chí Minh". Địa chỉ cũ chưa có phường/tỉnh → chỉ addressDetail
export const formatAddress = (a) =>
  [a?.addressDetail, a?.wardName, a?.provinceName].filter(Boolean).join(", ");
