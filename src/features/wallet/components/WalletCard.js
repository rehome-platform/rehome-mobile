import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { WALLET_LIMITS } from "@/constants/wallet";
import { useWallet } from "../hooks/useWallet";

// PR-01: hiện SỐ DƯ KHẢ DỤNG (PHASE4_GUIDE 0.4 #13). Lỗi tải → "—", bấm để thử lại (không chặn cả màn)
export function WalletCard() {
  const wallet = useWallet();
  const w = wallet.data;
  const onPress = () =>
    wallet.isError ? wallet.refetch() : router.push("/wallet");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ví của tôi"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.label}>SỐ DƯ KHẢ DỤNG</Text>
        <Text style={styles.amount}>
          {w ? formatVnd(w.availableBalance) : "—"}
        </Text>
        {w?.lockedBalance > 0 ? (
          <Text style={styles.sub}>Đang khoá {formatVnd(w.lockedBalance)}</Text>
        ) : wallet.isError ? (
          <Text style={styles.sub}>Chưa tải được — chạm để thử lại</Text>
        ) : null}
      </View>
      <Button
        title="Rút tiền"
        variant="secondary"
        disabled={!w || w.availableBalance < WALLET_LIMITS.MIN_PAYOUT}
        onPress={() => router.push("/wallet/withdraw")}
        style={styles.btn}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  left: { flex: 1, gap: 2 },
  label: { ...textStyles.label, color: colors.textSecondary },
  amount: {
    ...textStyles.title,
    fontSize: 26,
    lineHeight: 34,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  btn: { minHeight: 40, paddingHorizontal: spacing.md },
});
