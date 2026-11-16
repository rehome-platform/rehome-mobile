import { useEffect, useState } from "react";

// Số giây còn lại tới mốc deadlineMs (mili giây). Mỗi giây tính lại từ đồng hồ máy
// → app chạy nền rồi mở lại vẫn đúng (không đếm lùi từ 15:00)
export function useSecondsLeft(deadlineMs) {
  const calc = () =>
    deadlineMs ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)) : 0;
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!deadlineMs) return;
    const t = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [deadlineMs]);

  return left;
}
