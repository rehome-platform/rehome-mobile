import { AppState } from "react-native";
import { create } from "zustand";
import { queryClient } from "@/lib/query/queryClient";
import { notifyLocal } from "@/lib/push/push";
import {
  TRYON_JOB_STATUS as J,
  TRYON_LIMITS,
  isTryonBusy,
} from "@/constants/tryon";
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
    // Khoá NGAY (trước khi gọi BE): bấm 2 lần / lượt cũ đang dừng mà chưa xong → bỏ qua
    if (isTryonBusy(get().job)) return;
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
      if (controller !== mine) return; // đăng xuất trong lúc chờ
      controller = null;
      queryClient.invalidateQueries({ queryKey: tryonKeys.images });
      queryClient.invalidateQueries({ queryKey: tryonKeys.quota });
      // Đã bấm Huỷ: máy chủ vẫn tạo xong → ảnh nằm trong bộ sưu tập, không chuyển màn / không báo; mở khoá
      if (get().job?.status === J.CANCELLING) {
        set({ job: null, hasNew: true });
        return;
      }
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
      if (controller !== mine || mine.signal.aborted) return; // đăng xuất → không báo lỗi
      controller = null;
      // Lỗi hết lượt (429) hay lỗi sau khi BE đã trừ lượt → số lượt hiển thị phải lấy lại từ BE
      queryClient.invalidateQueries({ queryKey: tryonKeys.quota });
      // Đã bấm Huỷ: lượt lỗi thì thôi, không báo; mở khoá
      if (get().job?.status === J.CANCELLING) {
        set({ job: null });
        return;
      }
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

  // Huỷ phía app. KHÔNG ngắt request: máy chủ không dừng được model (0.5 A4), ngắt thì app mở khoá sớm
  // trong khi máy chủ vẫn chạy → người dùng tạo tiếp = 2 lượt song song. Giữ request, chỉ đánh dấu
  // "đang dừng" (vẫn khoá); request xong / lỗi thì bỏ kết quả và mở khoá (xem start)
  cancel: () => {
    if (get().job?.status !== J.RUNNING) return;
    set((s) => ({ job: { ...s.job, status: J.CANCELLING } }));
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
