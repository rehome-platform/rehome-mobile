import {
  OPERATION_SCOPES,
  ORG_TYPES,
  WEEKDAYS,
} from "@/features/organization/constants";

const labelOf = (list, value) =>
  list.find((x) => x.value === value)?.label ?? "";
export const orgTypeLabel = (value) => labelOf(ORG_TYPES, value);
export const scopeLabel = (value) => labelOf(OPERATION_SCOPES, value);

// { days: ["WED","MON"], openTime: "08:00", closeTime: "17:00" } → "T2, T4 · 08:00–17:00"
// Ngày xếp theo thứ tự trong tuần, không theo thứ tự bấm
export const formatReceivingHours = ({ days, openTime, closeTime }) => {
  const labels = WEEKDAYS.filter((d) => days.includes(d.value)).map(
    (d) => d.label,
  );
  return `${labels.join(", ")} · ${openTime}–${closeTime}`;
};

// Ngược lại formatReceivingHours: "T2, T4 · 08:00–17:00" → { days, openTime, closeTime }. Không đúng mẫu → null
export const parseReceivingHours = (text) => {
  const match = /^(.+) · (\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(text ?? "");
  if (!match) return null;
  const labels = match[1].split(", ");
  return {
    days: WEEKDAYS.filter((d) => labels.includes(d.label)).map((d) => d.value),
    openTime: match[2],
    closeTime: match[3],
  };
};

// Tích "dùng địa chỉ trụ sở" → lấy địa chỉ bước 1 (luôn là bản mới nhất)
export const pickupAddress = (info, location) =>
  location.useOfficeAddress ? info.address : location.address;
