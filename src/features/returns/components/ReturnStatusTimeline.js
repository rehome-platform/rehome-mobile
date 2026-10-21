import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { RETURN_STEPS, RETURN_STATUS as R } from "@/constants/returns";
import { toDate } from "@/features/orders/utils/time";
import { returnStepOf } from "../utils/returnRules";

// Mốc thời gian của từng bước (theo thứ tự RETURN_STEPS). [CHỜ BE câu 6] 3 mốc giữa entity chưa có
const TIMES = [
  "createdAt",
  "approvedAt",
  "handedOverAt",
  "inspectedAt",
  "resolvedAt",
];
const RESULT_TITLE = {
  [R.VALID]: "Hoàn tiền vào ví",
  [R.LOST]: "Thất lạc — vẫn hoàn tiền",
  [R.INVALID]: "Kết luận: không hợp lệ",
};

// Chữ phụ của bước ĐANG diễn ra
function activeDesc(r, i) {
  if (i === 1) return "Đang xử lý · thường trong 1 ngày làm việc";
  if (i === 2) return "Đang chờ bạn giao hàng cho shipper";
  if (i === 3)
    return r.status === R.INSPECTING
      ? "Kho đang kiểm tra · thường 1–2 ngày làm việc"
      : "Hàng đang trên đường về kho";
  return undefined;
}

// RT-02 "Tiến trình": 5 bước. Đã huỷ không vẽ (màn hình hiện khối lý do riêng)
export function ReturnStatusTimeline({ item: r }) {
  const done = returnStepOf(r);
  if (done < 0) return null;
  const steps = RETURN_STEPS.map((title, i) => {
    const state = i <= done ? "done" : i === done + 1 ? "active" : "todo";
    const time = r[TIMES[i]];
    return {
      title: i === 4 && done === 4 ? (RESULT_TITLE[r.status] ?? title) : title,
      state,
      desc:
        state === "done"
          ? time
            ? toDate(time).format("DD/MM HH:mm")
            : undefined
          : state === "active"
            ? activeDesc(r, i)
            : "Chưa tới bước này",
    };
  });
  return <StatusTimeline steps={steps} />;
}
