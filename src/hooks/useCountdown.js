import { useEffect, useState } from "react";

// Đếm ngược từng giây về 0. restart() để đếm lại từ đầu (AU-04, AU-06: "Gửi lại mã sau 0:SS")
export function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t); // rời màn / đếm lại → huỷ hẹn giờ cũ
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}

// 42 → "0:42"
export const formatCountdown = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
