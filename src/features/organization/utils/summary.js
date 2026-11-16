import { WEEKDAYS } from "@/features/organization/constants";

// Nhãn của một mã trong danh sách lựa chọn (useOrgOptions). Chưa tải xong / mã lạ → hiện chính mã đó
export const optionLabel = (list, value) =>
  list?.find((x) => x.value === value)?.label ?? value ?? "";

// { days: ["WED","MON","TUE"], openTime: "08:00", closeTime: "17:00" } → "T2 – T4 · 08:00–17:00".
// Ngày xếp theo thứ tự trong tuần (không theo thứ tự bấm); từ 3 ngày liền nhau trở lên gộp "T2 – T7"
export const formatReceivingHours = ({ days, openTime, closeTime }) => {
  const idx = WEEKDAYS.map((d, i) => (days.includes(d.value) ? i : -1)).filter(
    (i) => i >= 0,
  );
  const runs = [];
  idx.forEach((i) => {
    const last = runs[runs.length - 1];
    if (last && i === last[1] + 1) last[1] = i;
    else runs.push([i, i]);
  });
  const parts = runs.flatMap(([a, b]) =>
    b - a >= 2
      ? [`${WEEKDAYS[a].label} – ${WEEKDAYS[b].label}`]
      : WEEKDAYS.slice(a, b + 1).map((d) => d.label),
  );
  return `${parts.join(", ")} · ${openTime}–${closeTime}`;
};

// "Thứ 2" / "T2" / "Chủ nhật" / "CN" → chỉ số trong WEEKDAYS (T2 = 0 … CN = 6)
const dayIndex = (s) => {
  const t = s.trim().toLowerCase();
  if (t === "cn" || t.startsWith("chủ nhật")) return 6;
  const n = /^(?:t|thứ)\s*([2-7])$/.exec(t);
  return n ? Number(n[1]) - 2 : -1;
};

// Danh sách ngày dạng chữ: "T2, T4", "T2 – T7", "Thứ 2 - Thứ 6", "T2 – T4, CN" → ["MON", …]
const parseDays = (text) => {
  const out = new Set();
  text.split(",").forEach((part) => {
    const [from, to] = part.split(/\s*[–-]\s*/);
    const a = dayIndex(from);
    const b = to != null ? dayIndex(to) : a;
    if (a < 0 || b < 0) return;
    for (let i = a; i <= b; i++) out.add(WEEKDAYS[i].value);
  });
  return WEEKDAYS.map((d) => d.value).filter((v) => out.has(v));
};

// Ngược lại formatReceivingHours → { days, openTime, closeTime }. Đọc cả kiểu BE / dữ liệu mẫu tạo sẵn
// "08:00 - 17:00 (Thứ 2 - Thứ 6)". Không đọc được → null (màn hình để người dùng chọn lại)
export const parseReceivingHours = (text) => {
  const s = text ?? "";
  const app = /^(.+) · (\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/.exec(s);
  const be = /^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s*\((.+)\)$/.exec(s);
  const [daysText, openTime, closeTime] = app
    ? [app[1], app[2], app[3]]
    : be
      ? [be[3], be[1], be[2]]
      : [];
  if (!daysText) return null;
  const days = parseDays(daysText);
  return days.length ? { days, openTime, closeTime } : null;
};

// Tích "dùng địa chỉ trụ sở" → lấy địa chỉ bước 1 (luôn là bản mới nhất)
export const pickupAddress = (info, location) =>
  location.useOfficeAddress ? info.address : location.address;
