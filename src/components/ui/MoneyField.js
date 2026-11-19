import { useState } from "react";
import { TextField } from "./TextField";
import { formatNumber, parseVnd } from "@/utils/money";

// Ô nhập tiền: hiện "1.000.000" + chữ "đ" cuối ô; trả về number (ô trống → undefined)
//
// Con trỏ do ô tự giữ (không để người dùng đặt giữa số): ô tự chèn dấu chấm ngăn cách nên nếu con trỏ đứng
// giữa số / ngay sau dấu chấm thì bấm xoá chỉ xoá dấu chấm → dấu chấm tự hiện lại, trông như "không xoá được";
// gõ thêm thì số chen vào giữa (lỗi khi sửa giá đã điền sẵn — vd ký gửi lại từ yêu cầu bị từ chối).
// - Bấm vào ô đang có số → CHỌN HẾT: gõ là thay giá mới, xoá là xoá hết
// - Đang gõ → con trỏ luôn ở CUỐI: xoá từng chữ số, thêm số vào cuối
export function MoneyField({ value, onChange, onFocus, ...props }) {
  const text = formatNumber(value);
  const [selectAll, setSelectAll] = useState(false);
  const end = text.length;

  return (
    <TextField
      {...props}
      keyboardType="number-pad"
      maxLength={13} // tối đa "1.000.000.000"
      suffix="đ"
      value={text}
      selection={selectAll ? { start: 0, end } : { start: end, end }}
      onFocus={(e) => {
        setSelectAll(end > 0);
        onFocus?.(e);
      }}
      onChangeText={(t) => {
        setSelectAll(false);
        onChange(parseVnd(t));
      }}
    />
  );
}
