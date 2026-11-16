import { formatVnd } from "@/utils/money";
import { formatRate } from "@/utils/consignment";

// ⚠️ [GIẢ ĐỊNH] Bản tóm tắt từ business rules (Tài liệu tổng quan mục 7, 8, 11).
// PHẢI thay bằng NGUYÊN VĂN mục 12 (mẫu biên nhận) trước khi demo. Số liệu lấy từ chính biên nhận.
// Điều 4–7, 9, 10 (Điều 1–3 và 8 có bảng / nhấn mạnh nên dựng thẳng trong ReceiptScreen).
// no = số điều → ReceiptScreen xếp ĐÚNG thứ tự 1 → 10
export const otherClauses = (r) => [
  {
    no: 4,
    title: "ĐIỀU 4 — GIẢM GIÁ",
    body: `Sau khi xác nhận, bạn chỉ được giảm giá bán, mỗi ngày tối đa 1 lần và không thấp hơn giá sàn ${formatVnd(r.floorPrice)}. Muốn tăng giá phải lập lại biên nhận với ReHome.`,
  },
  {
    no: 5,
    title: "ĐIỀU 5 — RÚT HÀNG",
    body: `Trong ${r.freeWithdrawalWindowDays} ngày đầu của mỗi kỳ, bạn được rút hàng không mất phí. Ngoài khoảng này, phí rút hàng là ${r.withdrawalFee ? formatVnd(r.withdrawalFee) : "theo biểu phí ReHome"}.`,
  },
  {
    no: 6,
    title: "ĐIỀU 6 — HOA HỒNG VÀ THANH TOÁN",
    body: "Hoa hồng tính theo kỳ đang chạy tại thời điểm đơn hàng được đặt. Tiền bán hàng sau khi trừ hoa hồng được cộng vào ví ReHome khi đơn hoàn thành.",
  },
  {
    no: 7,
    title: "ĐIỀU 7 — HÀNG XUỐNG CẤP",
    body: `Nếu hàng bị hư hỏng trong thời gian ReHome giữ hàng, bạn được bồi thường ${formatRate(r.degradedCompensationRate)} giá bán hiện tại.`,
  },
  {
    no: 9,
    title: "ĐIỀU 9 — HIỆU LỰC",
    body: "Các mức phí, tỷ lệ và thời hạn trong biên nhận được giữ nguyên đến khi kết thúc. ReHome thay đổi cấu hình sau này không ảnh hưởng biên nhận này.",
  },
  {
    no: 10,
    title: "ĐIỀU 10 — XÁC NHẬN ĐIỆN TỬ",
    body: "Biên nhận không có chữ ký tay. Giá trị xác nhận dựa trên thao tác bấm xác nhận trên tài khoản đã đăng nhập, cùng thời điểm được hệ thống ghi nhận và lưu trong nhật ký.",
  },
];
