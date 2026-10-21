import { Alert } from "react-native";
import { router } from "expo-router";
import { create } from "zustand";
import { queryClient } from "@/lib/query/queryClient";
import { showToast } from "@/utils/toast";
import { TRYON_JOB_STATUS as J } from "@/constants/tryon";
import { tryonApi } from "@/features/tryon/api/tryonApi";
import { tryonKeys } from "@/features/tryon/api/queryKeys";

// Việc tạo ảnh thử đồ chạy NGOÀI màn hình (PHASE6_GUIDE 0.5 A3): rời AI-03 vẫn chạy tiếp,
// xong mà không đứng ở phòng thử đồ → hỏi "Xem". Chỉ một việc một lúc. Tắt hẳn app thì mất (chưa có API job)
let controller = null; // AbortController của việc đang chạy (không để trong state)

export const useTryonJobStore = create((set, get) => ({
  job: null, // { status, startedAt, payload, items, resultId, error }
  watching: false, // phòng thử đồ đang mở → xong thì màn tự chuyển sang kết quả, không hỏi
  hasNew: false, // chấm ở "Ảnh thử đồ đã lưu" (PR-01) tới khi mở bộ sưu tập

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
      }));
      if (!get().watching) {
        Alert.alert(
          "Ảnh thử đồ đã xong",
          "Ảnh đã lưu vào bộ sưu tập của bạn.",
          [
            { text: "Để sau", style: "cancel" },
            {
              text: "Xem",
              onPress: () => {
                get().clear();
                router.push(`/tryon/result/${img.id}`);
              },
            },
          ],
        );
      }
    } catch (e) {
      if (controller !== mine || mine.signal.aborted) return; // huỷ → không báo lỗi
      controller = null;
      set((s) => ({ job: { ...s.job, status: J.ERROR, error: e } }));
      if (!get().watching)
        showToast("Chưa tạo được ảnh thử đồ. Mở lại phòng thử đồ để thử lại.");
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
