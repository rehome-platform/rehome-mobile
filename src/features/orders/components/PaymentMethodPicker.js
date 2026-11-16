import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { RadioCard } from "@/components/ui/RadioCard";
import { PAYMENT_METHOD } from "@/constants/order";
import { formatVnd } from "@/utils/money";
import { useWallet } from "@/features/wallet/hooks/useWallet";

// MoMo / VNPay / Ví ReHome (F-056: trả TRỌN bằng một phương thức). amount: số cần trả để so với số dư khả dụng.
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

  // Đang chọn Ví mà số dư không còn đủ (vd tổng thật có thêm phí ship) → về MoMo
  useEffect(() => {
    if (value === PAYMENT_METHOD.WALLET && available != null && !walletOk)
      onChange(PAYMENT_METHOD.MOMO);
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
        title="Ví MoMo"
        description="Mở trang MoMo để trả, xong đóng trang quay lại ReHome"
        selected={value === PAYMENT_METHOD.MOMO}
        onPress={() => onChange(PAYMENT_METHOD.MOMO)}
      />
      <RadioCard
        title="VNPay"
        description="Thẻ ATM / Internet Banking / QR ngân hàng"
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
