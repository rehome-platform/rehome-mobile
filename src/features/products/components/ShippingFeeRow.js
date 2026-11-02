import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useShippingFee } from "../hooks/useShippingFee";

// BR-04: "Vận chuyển tới <tỉnh> · 25.000 đ" — phí GHN thật từ kho giữ món tới địa chỉ mặc định (như Shopee).
// Chỉ Member (API cần đăng nhập). Chưa có địa chỉ → mời thêm. Lỗi tính phí → ẩn dòng phí, không chặn mua
export function ShippingFeeRow({ product }) {
  const addresses = useAddresses();
  const list = addresses.data ?? [];
  const address = list.find((a) => a.isDefault) ?? list[0];
  const fee = useShippingFee(product.id, address);

  if (addresses.isPending) return null;

  if (!address) {
    return (
      <Pressable
        onPress={() => router.push("/addresses/new")}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.flex, styles.muted]}>
          Thêm địa chỉ giao hàng để xem phí vận chuyển
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
    );
  }

  if (fee.isError) return null;

  return (
    <View style={styles.row}>
      <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
      <View style={styles.flex}>
        <Text style={styles.text}>
          Vận chuyển tới <Text style={styles.bold}>{address.provinceName}</Text>
        </Text>
        {product.warehouseName ? (
          <Text style={styles.muted}>Giao từ {product.warehouseName}</Text>
        ) : null}
      </View>
      {fee.isSuccess ? (
        <Text style={styles.fee}>{formatVnd(fee.data)}</Text>
      ) : (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  text: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  fee: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
});
