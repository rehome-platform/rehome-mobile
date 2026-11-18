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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => (a ?? null) === (b ?? null);
// Ảnh trong bộ sưu tập đúng bộ đồ + người mẫu của lượt này
const matchesPayload = (img, p) =>
  same(img.topProductId, p.topProductId) &&
  same(img.bottomProductId, p.bottomProductId) &&
  same(img.dressProductId, p.dressProductId) &&
  (!p.modelType || img.modelType === p.modelType);

// Request tạo ảnh rớt (mất mạng, hết giờ chờ, kết nối bị cắt giữa chừng) KHÔNG có nghĩa máy chủ không tạo:
// BE vẫn chạy AI và lưu ảnh vào bộ sưu tập. Trước đây app báo lỗi ngay → người dùng thấy "hết giờ mà không có ảnh"
// trong khi bộ sưu tập lại có ảnh, bấm Thử lại thì ra 2 ảnh. Giờ hỏi bộ sưu tập định kỳ để lấy đúng ảnh đó.
// isActive() = false (đăng xuất) → dừng
async function recoverCreatedImage(payload, startedAt, isActive) {
  const since = startedAt - TRYON_LIMITS.RECOVER_CLOCK_SKEW_MS;
  const deadline = Date.now() + TRYON_LIMITS.RECOVER_MAX_MS;
  while (isActive() && Date.now() < deadline) {
    try {
      const page = await tryonApi.getTryonImages({ page: 0, size: 5 });
      const img = (page.content ?? []).find(
        (x) =>
          matchesPayload(x, payload) &&
          new Date(x.createdAt).getTime() >= since,
      );
      if (img) return img;
    } catch {
      // vẫn mất mạng → hỏi lại lần sau
    }
    await sleep(TRYON_LIMITS.RECOVER_POLL_MS);
  }
  return null;
}

// Lỗi mà máy chủ CÓ THỂ vẫn tạo xong ảnh: không tới được / không nhận được trả lời (status 0: mất mạng, hết giờ),
// hoặc cổng trung gian cắt kết nối (502 không có mã của BE, 504). Lỗi có mã của BE (hết lượt, thiếu món, AI lỗi 502
// có code) là BE đã trả lời rõ → không tìm
const mayStillBeCreated = (e) =>
  e?.status === 0 ||
  e?.status === 504 ||
  (e?.status === 502 && String(e?.code ?? "").startsWith("HTTP_"));

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
    const startedAt = Date.now();
    set({
      job: {
        status: J.RUNNING,
        startedAt,
        payload,
        items,
        resultId: null,
        error: null,
        recovering: false, // đang tìm ảnh trong bộ sưu tập sau khi mất kết nối / hết giờ
      },
    });
    let img = null;
    try {
      img = await tryonApi.createTryonImage(payload, { signal: mine.signal });
    } catch (e) {
      if (controller !== mine || mine.signal.aborted) return; // đăng xuất → không báo lỗi
      if (mayStillBeCreated(e)) {
        set((s) => ({ job: s.job && { ...s.job, recovering: true } }));
        img = await recoverCreatedImage(
          payload,
          startedAt,
          () => controller === mine,
        );
        if (controller !== mine) return;
      }
      if (!img) {
        get()._fail(e);
        return;
      }
    }
    if (controller !== mine) return; // đăng xuất trong lúc chờ
    get()._succeed(img);
  },

  // Tạo xong (trả về trực tiếp, hoặc tìm lại được trong bộ sưu tập)
  _succeed: (img) => {
    controller = null;
    queryClient.invalidateQueries({ queryKey: tryonKeys.images });
    queryClient.invalidateQueries({ queryKey: tryonKeys.quota });
    // Đã bấm Huỷ: máy chủ vẫn tạo xong → ảnh nằm trong bộ sưu tập, không chuyển màn / không báo; mở khoá
    if (get().job?.status === J.CANCELLING) {
      set({ job: null, hasNew: true });
      return;
    }
    set((s) => ({
      job: { ...s.job, status: J.DONE, resultId: img.id, recovering: false },
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
  },

  // Không tạo được (BE báo lỗi rõ, hoặc mất kết nối mà tìm mãi không thấy ảnh)
  _fail: (e) => {
    controller = null;
    // Lỗi hết lượt (429) hay lỗi sau khi BE đã trừ lượt → số lượt hiển thị phải lấy lại từ BE
    queryClient.invalidateQueries({ queryKey: tryonKeys.quota });
    queryClient.invalidateQueries({ queryKey: tryonKeys.images });
    // Đã bấm Huỷ: lượt lỗi thì thôi, không báo; mở khoá
    if (get().job?.status === J.CANCELLING) {
      set({ job: null });
      return;
    }
    set((s) => ({
      job: { ...s.job, status: J.ERROR, error: e, recovering: false },
    }));
    // Trong app: khung nổi đổi sang "Chưa tạo được · Bấm để thử lại"
    if (inBackground())
      notifyLocal({
        title: "Chưa tạo được ảnh thử đồ",
        body: "Mở ReHome để thử lại.",
        data: { type: "TRYON_FAILED" },
      });
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
