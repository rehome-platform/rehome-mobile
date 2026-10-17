import { TextField } from "./TextField";
import { formatNumber, parseVnd } from "@/utils/money";

// Ô nhập tiền: hiện "1.000.000" + chữ "đ" cuối ô; trả về number (ô trống → undefined)
export function MoneyField({ value, onChange, ...props }) {
  return (
    <TextField
      {...props}
      keyboardType="number-pad"
      maxLength={13} // tối đa "1.000.000.000"
      suffix="đ"
      value={formatNumber(value)}
      onChangeText={(text) => onChange(parseVnd(text))}
    />
  );
}
