import { formatVnd } from "@/utils/money";
import { formatRate } from "@/utils/consignment";

// Điều 4–7, 9, 10 của biên nhận ký gửi — NGUYÊN VĂN mẫu biên nhận (Tài liệu tổng quan mục 12, docs/OVERVIEW.md của BE).
// Điều 1–3 và 8 có bảng / nhấn mạnh nên dựng thẳng trong ReceiptScreen. no = số điều → ReceiptScreen xếp đúng 1 → 10.
// Điều chỉnh có chủ đích so với mẫu (ghi lại để đối chiếu khi bảo vệ):
// - Xưng hô thống nhất với phần còn lại của màn: Bên A → "ReHome", Bên B → "bạn"; "kho" → "địa điểm ký gửi".
// - Mọi con số lấy từ CHÍNH biên nhận (snapshot lúc ký): giá sàn, phí rút hàng, số ngày rút miễn phí, tỷ lệ đền.
//   Không viết cứng 07 ngày / 50.000 đ / 50% như ví dụ trong mẫu.
// - Bỏ "thuế" ở 4.3, 6.2, 6.3: hệ thống hiện KHÔNG khấu trừ thuế khi trả tiền cho người ký gửi (BE ORDER_PAYOUT =
//   giá − hoa hồng). Ghi "trừ thuế" mà không trừ thật là sai với số tiền người dùng nhận.
// - 7.3: hạn đến lấy hàng do Admin cấu hình và ghi trong từng yêu cầu rút hàng → không ghi số ngày cố định.
export const otherClauses = (r) => {
  const rate1 = r.commissionRateTerm1;
  const example =
    r.agreedPrice && rate1 != null
      ? `6.3. Ví dụ: bán ở giá ${formatVnd(r.agreedPrice)} trong kỳ 1, hoa hồng ${formatRate(rate1)} là ${formatVnd(
          Math.round(r.agreedPrice * rate1),
        )}, bạn nhận ${formatVnd(r.agreedPrice - Math.round(r.agreedPrice * rate1))}.`
      : null;
  return [
    {
      no: 4,
      title: "ĐIỀU 4 — QUYỀN VÀ NGHĨA VỤ CỦA REHOME",
      body: [
        "4.1. Bảo quản hàng hóa tại địa điểm ký gửi trong suốt thời hạn ký gửi.",
        "4.2. Chụp ảnh, đăng bán, đóng gói và giao hàng cho người mua.",
        "4.3. Thu hộ tiền bán hàng và chuyển vào ví của bạn sau khi trừ hoa hồng.",
        "4.4. Không tự ý thay đổi giá bán đã thống nhất tại Điều 2.",
        "4.5. Chịu trách nhiệm với hư hỏng, mất mát phát sinh trong quá trình lưu giữ và vận chuyển.",
      ].join("\n"),
    },
    {
      no: 5,
      title: "ĐIỀU 5 — QUYỀN VÀ NGHĨA VỤ CỦA BẠN",
      body: [
        "5.1. Cam kết hàng hóa thuộc sở hữu hợp pháp của mình, không phải hàng gian, hàng cấm.",
        "5.2. Chịu trách nhiệm về nguồn gốc hàng hóa trước pháp luật.",
        `5.3. Được theo dõi tình trạng hàng hóa, giảm giá bán (không thấp hơn giá sàn ${formatVnd(r.floorPrice)}) và rút hàng theo Điều 7.`,
        "5.4. Được nhận tiền bán hàng vào ví và rút tiền theo quy định của nền tảng.",
      ].join("\n"),
    },
    {
      no: 6,
      title: "ĐIỀU 6 — THANH TOÁN",
      body: [
        "6.1. Khi đơn hàng hoàn thành và hết thời hạn trả hàng, ReHome cộng số tiền bạn được hưởng vào ví của bạn trên ứng dụng.",
        "6.2. Số tiền bạn được hưởng = giá bán thực tế − hoa hồng (theo tỷ lệ của kỳ đang chạy tại thời điểm đơn hàng được đặt).",
        example,
        "6.4. Bạn rút tiền từ ví theo yêu cầu, không cần ReHome phê duyệt.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      no: 7,
      title: "ĐIỀU 7 — RÚT LẠI HÀNG HÓA",
      body: [
        "7.1. Bạn được rút hàng bất kỳ lúc nào khi hàng chưa có đơn đặt.",
        `7.2. Rút trong ${r.freeWithdrawalWindowDays} ngày đầu mỗi kỳ: miễn phí. Rút ngoài thời gian này: chịu phí rút hàng là ${
          r.withdrawalFee ? formatVnd(r.withdrawalFee) : "theo biểu phí ReHome"
        }.`,
        "7.3. Bạn đến địa điểm ký gửi nhận hàng trong thời hạn ghi trong yêu cầu rút hàng, tính từ khi yêu cầu được chấp nhận. Quá hạn, yêu cầu bị hủy, hàng được đăng bán lại và không hoàn phí.",
      ].join("\n"),
    },
    {
      no: 9,
      title: "ĐIỀU 9 — RỦI RO VÀ BỒI THƯỜNG",
      body: [
        `9.1. Hàng hư hỏng, xuống cấp do lưu giữ hoặc vận chuyển: ReHome bồi thường. Bạn chọn nhận đủ số tiền lẽ ra được hưởng và giao hàng cho ReHome, hoặc nhận lại hàng kèm bồi thường ${formatRate(r.degradedCompensationRate)} số tiền đó.`,
        "9.2. Hàng bị xác định là hàng giả sau khi đã bán: ReHome hoàn tiền cho người mua và tiêu hủy hàng hóa. Bạn không bị phạt nếu đã trung thực khai báo.",
        "9.3. Hàng bị người mua trả và được xác nhận hợp lệ: hàng được đăng bán lại, kỳ ký gửi tiếp tục, bạn không chịu chi phí.",
      ].join("\n"),
    },
    {
      no: 10,
      title: "ĐIỀU 10 — HIỆU LỰC",
      body: [
        "10.1. Biên nhận có hiệu lực kể từ thời điểm bạn xác nhận trên ứng dụng.",
        "10.2. Các mức phí, tỷ lệ và thời hạn ghi tại biên nhận này được giữ nguyên đến khi kết thúc, không thay đổi theo cấu hình mới của nền tảng.",
        "Biên nhận này không có chữ ký tay. Giá trị xác nhận dựa trên thao tác bấm xác nhận của bạn trên tài khoản đã đăng nhập, cùng thời điểm được hệ thống ghi nhận và lưu trong nhật ký hệ thống.",
      ].join("\n"),
    },
  ];
};
