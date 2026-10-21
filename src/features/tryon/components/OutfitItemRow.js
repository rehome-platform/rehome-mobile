import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { PRODUCT_STATUS } from "@/constants/consignment";

// Một món trong ảnh thử đồ: ảnh · tên · giá · nút bên phải (truyền vào). Không còn bán → mờ + "Không còn khả dụng"
export function OutfitItemRow({ item, right }) {
  const available = item.status === PRODUCT_STATUS.ON_SALE;
  return (
    <View style={[styles.row, !available && styles.dim]}>
      <View style={styles.thumb}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={22}
            color={colors.textSecondary}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatVnd(item.currentPrice)}</Text>
        {!available ? (
          <Text style={styles.muted}>Không còn khả dụng</Text>
        ) : null}
      </View>
      {available ? right : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dim: { opacity: 0.5 },
  thumb: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  info: { flex: 1, gap: 2 },
  name: { ...textStyles.body, color: colors.text },
  price: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
});
