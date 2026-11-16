import { useEffect, useState } from "react";
import { TRYON_JOB_STATUS as J, TRYON_LIMITS } from "@/constants/tryon";
import { averageTryonMs, useTryonJobStore } from "@/stores/tryonJobStore";

// BE tạo ảnh trong MỘT request (API 97), không báo tiến độ → % là ƯỚC LƯỢNG theo thời gian đã chờ:
// chạy nhanh lúc đầu, chậm dần, tới mốc dự kiến được ~90%, không bao giờ quá 95% khi chưa xong; xong thật mới 100%.
// Mốc dự kiến = trung bình thời gian THẬT các lần tạo gần đây trên máy này (không viết cứng); chưa có thì DEFAULT.
const CAP = 95;
const K = 3; // 95 × (1 − e^−3) ≈ 90% tại mốc dự kiến

export function estimateTryonProgress(startedAt, expectedMs, now = Date.now()) {
  const elapsed = Math.max(0, now - startedAt);
  return CAP * (1 - Math.exp((-K * elapsed) / expectedMs));
}

const TICK_MS = 250;

// { percent: 0–100, waitedSec, typicalSec (null = chưa đo), slow: đã chờ lâu hơn hẳn mức thường } của việc đang chạy
export function useTryonProgress(job) {
  const running = job?.status === J.RUNNING;
  const durations = useTryonJobStore((s) => s.recentDurations);
  const avg = averageTryonMs(durations);
  const expectedMs = avg ?? TRYON_LIMITS.DEFAULT_EXPECTED_MS;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, [running, job?.startedAt]);

  const typicalSec = avg != null ? Math.round(avg / 1000) : null;
  if (!job) return { percent: 0, waitedSec: 0, typicalSec, slow: false };
  if (job.status === J.DONE)
    return { percent: 100, waitedSec: 0, typicalSec, slow: false };
  const elapsed = now - job.startedAt;
  return {
    percent: Math.floor(estimateTryonProgress(job.startedAt, expectedMs, now)),
    waitedSec: Math.max(0, Math.floor(elapsed / 1000)),
    typicalSec,
    slow: elapsed > expectedMs * 1.5,
  };
}
