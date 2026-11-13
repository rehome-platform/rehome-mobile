import { useEffect, useState } from "react";
import { TRYON_JOB_STATUS as J, TRYON_LIMITS } from "@/constants/tryon";

// BE tạo ảnh trong MỘT request (API 97), không báo tiến độ → % là ƯỚC LƯỢNG theo thời gian đã chờ:
// chạy nhanh lúc đầu, chậm dần, tới khoảng thời gian thường gặp (EXPECTED_MS) được ~90%, không bao giờ quá 95%
// khi chưa xong. Xong thật mới nhảy 100%. Giống thanh tải trang của trình duyệt.
const CAP = 95;
const K = 3; // 95 × (1 − e^−3) ≈ 90% tại EXPECTED_MS

export function estimateTryonProgress(startedAt, now = Date.now()) {
  const elapsed = Math.max(0, now - startedAt);
  return CAP * (1 - Math.exp((-K * elapsed) / TRYON_LIMITS.EXPECTED_MS));
}

const TICK_MS = 250;

// { percent: 0–100 (số nguyên), waitedSec } của việc đang chạy; DONE → 100. Tự cập nhật khi đang chạy
export function useTryonProgress(job) {
  const running = job?.status === J.RUNNING;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, [running, job?.startedAt]);

  if (!job) return { percent: 0, waitedSec: 0 };
  if (job.status === J.DONE) return { percent: 100, waitedSec: 0 };
  return {
    percent: Math.floor(estimateTryonProgress(job.startedAt, now)),
    waitedSec: Math.max(0, Math.floor((now - job.startedAt) / 1000)),
  };
}
