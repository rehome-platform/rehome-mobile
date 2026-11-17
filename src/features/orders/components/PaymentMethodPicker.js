import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { RadioCard } from "@/components/ui/RadioCard";
import { DEFAULT_GATEWAY, PAYMENT_METHOD } from "@/constants/order";
import { formatVnd } from "@/utils/money";
import { useWallet } from "@/features/wallet/hooks/useWallet";

// VNPay / Ví ReHome (F-056: trả TRỌN bằng một phương thức). Đã bỏ MoMo 17/11 (sandbox MoMo ngừng hỗ trợ).
// Dùng chung: đặt hàng, màn chờ thanh toán, phí rút hàng, mua gói. amount: số cần trả để so với số dư khả dụng.
// isSubtotal: BR-08 chưa biết phí ship → so với tiền hàng và nhắc cần đủ cả phí ship
export function PaymentMethodPicker({
  value,
  onChange,
  amount,
  isSubtotal = false,
}) {
  const wallet = useWallet();
  const available = wallet.data?.availableBalance;
  const short = available != null ? amount - available : null;
  const walletOk = available != null && short <= 0;

  // Đang chọn Ví mà số dư không còn đủ (vd tổng thật có thêm phí ship) → về VNPay.
  // Còn giữ lựa chọn MoMo cũ (đã bỏ 17/11) → cũng về VNPay
  useEffect(() => {
    if (
      value === PAYMENT_METHOD.MOMO ||
      (value === PAYMENT_METHOD.WALLET && available != null && !walletOk)
    )
      onChange(DEFAULT_GATEWAY);
  }, [value, walletOk, available]);

  const walletDesc =
    available == null
      ? "Đang tải số dư…"
      : walletOk
        ? `Số dư khả dụng ${formatVnd(available)}`
        : `Số dư khả dụng ${formatVnd(available)} · Thiếu ${formatVnd(short)}`;

  return (
    <View style={styles.wrap}>
      <RadioCard
        title="VNPay"
        description="Thẻ ATM / Internet Banking / QR ngân hàng — mở trang VNPay để trả, xong quay lại ReHome"
        selected={value === PAYMENT_METHOD.VNPAY}
        onPress={() => onChange(PAYMENT_METHOD.VNPAY)}
      />
      <RadioCard
        title="Ví ReHome"
        description={walletDesc}
        selected={value === PAYMENT_METHOD.WALLET}
        onPress={walletOk ? () => onChange(PAYMENT_METHOD.WALLET) : undefined}
        style={!walletOk && styles.off}
      />
      {isSubtotal && walletOk ? (
        <Text style={styles.hint}>
          Trả bằng ví cần đủ cả phí vận chuyển — số chính xác hiện ở bước thanh
          toán.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  off: { opacity: 0.5 },
  hint: { ...textStyles.caption, color: colors.textSecondary },
});
