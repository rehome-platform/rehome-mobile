import { AppState } from "react-native";
import { create } from "zustand";
import { queryClient } from "@/lib/query/queryClient";
import { notifyLocal } from "@/lib/push/push";
import { TRYON_JOB_STATUS as J, TRYON_LIMITS } from "@/constants/tryon";
import { tryonApi } from "@/features/tryon/api/tryonApi";
import { tryonKeys } from "@/features/tryon/api/queryKeys";

// Việc tạo ảnh thử đồ chạy NGOÀI màn hình (PHASE6_GUIDE 0.5 A3): rời AI-03 vẫn chạy tiếp.
// Báo tiến độ / kết quả bằng khung nổi TryonJobBanner (gắn ở layout gốc, hiện trên mọi màn trừ phòng thử đồ).
// App đang ở nền lúc xong / lỗi → thêm thông báo tại máy. Chỉ một việc một lúc. Tắt hẳn app thì mất (chưa có API job)
const inBackground = () => AppState.currentState !== "active";
let controller = null; // AbortController của việc đang chạy (không để trong state)

export const useTryonJobStore = create((set, get) => ({
  job: null, // { status, startedAt, payload, items, resultId, error }
  watching: false, // phòng thử đồ đang mở → xong thì màn tự chuyển sang kết quả, không hỏi
  hasNew: false, // chấm ở "Ảnh thử đồ đã lưu" (PR-01) tới khi mở bộ sưu tập
  // Thời gian THẬT (ms) của các lần tạo ảnh thành công gần đây — để ước lượng thanh % và câu "lần gần đây mất ~x giây".
  // Chỉ trong RAM (mở lại app thì đo lại từ đầu)
  recentDurations: [],

  setWatching: (watching) => set({ watching }),
  markSeen: () => set({ hasNew: false }),
  clear: () => set({ job: null }),

  start: async (payload, items) => {
    if (get().job?.status === J.RUNNING) return;
    const mine = new AbortController();
    controller = mine;
    set({
      job: {
        status: J.RUNNING,
        startedAt: Date.now(),
        payload,
        items,
        resultId: null,
        error: null,
      },
    });
    try {
      const img = await tryonApi.createTryonImage(payload, {
        signal: mine.signal,
      });
      if (controller !== mine) return; // đã huỷ trong lúc chờ
      controller = null;
      queryClient.invalidateQueries({ queryKey: tryonKeys.images });
      set((s) => ({
        job: { ...s.job, status: J.DONE, resultId: img.id },
        hasNew: true,
        recentDurations: [
          ...s.recentDurations,
          Date.now() - s.job.startedAt,
        ].slice(-TRYON_LIMITS.RECENT_SAMPLES),
      }));
      // Trong app: khung nổi tự đổi sang "Đã xong · Bấm để xem" (phòng thử đồ đang mở thì tự chuyển màn)
      if (inBackground())
        notifyLocal({
          title: "Ảnh thử đồ đã xong",
          body: "Ảnh đã lưu vào bộ sưu tập. Bấm để xem.",
          data: { type: "TRYON_DONE", tryonImageId: img.id },
        });
    } catch (e) {
      if (controller !== mine || mine.signal.aborted) return; // huỷ → không báo lỗi
      controller = null;
      set((s) => ({ job: { ...s.job, status: J.ERROR, error: e } }));
      // Trong app: khung nổi đổi sang "Chưa tạo được · Bấm để thử lại"
      if (inBackground())
        notifyLocal({
          title: "Chưa tạo được ảnh thử đồ",
          body: "Mở ReHome để thử lại.",
          data: { type: "TRYON_FAILED" },
        });
    }
  },

  // Huỷ phía app (không dừng được model trên máy chủ — 0.5 A4)
  cancel: () => {
    controller?.abort();
    controller = null;
    set({ job: null });
  },

  // Đăng xuất
  reset: () => {
    controller?.abort();
    controller = null;
    set({ job: null, watching: false, hasNew: false });
  },
}));

// Trung bình thời gian tạo ảnh gần đây (ms); chưa đo lần nào → null
export const averageTryonMs = (durations) =>
  durations.length
    ? durations.reduce((s, d) => s + d, 0) / durations.length
    : null;
