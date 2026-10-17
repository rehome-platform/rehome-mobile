import { formatVnd } from "@/utils/money";
import { formatRate } from "@/utils/consignment";

// ⚠️ [GIẢ ĐỊNH] Bản tóm tắt từ business rules (Tài liệu tổng quan mục 7, 8, 11).
// PHẢI thay bằng NGUYÊN VĂN mục 12 (mẫu biên nhận) trước khi demo. Số liệu lấy từ chính biên nhận.
export const otherClauses = (r) => [
  {
    title: "Điều 4 — Giảm giá",
    body: `Sau khi xác nhận, bạn chỉ được giảm giá bán, mỗi ngày tối đa 1 lần và không thấp hơn giá sàn ${formatVnd(r.floorPrice)}. Muốn tăng giá phải lập lại biên nhận với kho.`,
  },
  {
    title: "Điều 5 — Rút hàng",
    body: `Trong ${r.freeWithdrawalWindowDays} ngày đầu của mỗi kỳ, bạn được rút hàng không mất phí. Ngoài khoảng này, phí rút hàng là ${r.withdrawalFee ? formatVnd(r.withdrawalFee) : "theo biểu phí ReHome"}.`,
  },
  {
    title: "Điều 6 — Hoa hồng và thanh toán",
    body: "Hoa hồng tính theo kỳ đang chạy tại thời điểm đơn hàng được đặt. Tiền bán hàng sau khi trừ hoa hồng được cộng vào ví ReHome khi đơn hoàn thành.",
  },
  {
    title: "Điều 7 — Hàng xuống cấp",
    body: `Nếu hàng bị hư hỏng trong thời gian ReHome lưu kho, bạn được bồi thường ${formatRate(r.degradedCompensationRate)} giá bán hiện tại.`,
  },
  {
    title: "Điều 9 — Hiệu lực",
    body: "Các mức phí, tỷ lệ và thời hạn trong biên nhận được giữ nguyên đến khi kết thúc. ReHome thay đổi cấu hình sau này không ảnh hưởng biên nhận này.",
  },
  {
    title: "Điều 10 — Xác nhận điện tử",
    body: "Biên nhận không có chữ ký tay. Giá trị xác nhận dựa trên thao tác bấm xác nhận trên tài khoản đã đăng nhập, cùng thời điểm được hệ thống ghi nhận và lưu trong nhật ký.",
  },
];
