import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";

// Một dòng món: ảnh nhỏ · tên · giá. faded: món không đặt được
export function OrderLine({ line, faded }) {
  return (
    <View style={[styles.line, faded && styles.faded]}>
      <View style={styles.thumb}>
        {line.thumbnailUrl ? (
          <Image
            source={{ uri: line.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Ionicons
            name="shirt-outline"
            size={20}
            color={colors.textSecondary}
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {line.name}
      </Text>
      <Text style={[styles.price, faded && styles.struck]}>
        {formatVnd(line.price)}
      </Text>
    </View>
  );
}

// Phí ship của đơn: fee = kết quả useQueries (phí GHN thật). Chưa có địa chỉ / lỗi → "Tính khi đặt hàng"
const feeText = (fee) => {
  if (fee?.isSuccess) return formatVnd(fee.data);
  if (fee?.isPending && fee.fetchStatus !== "idle") return "Đang tính…";
  return "Tính khi đặt hàng";
};

// "Đơn 1 / 2 — Kho Quận 1": một đơn, một phí vận chuyển. Đơn mới luôn 1 món (BE tách đơn theo món)
export function OrderGroupCard({ group, index, total, fee }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          {total > 1 ? `Đơn ${index + 1} / ${total} — ` : ""}
          {group.warehouseName}
        </Text>
        {group.lines.length > 1 ? (
          <Text style={styles.count}>{group.lines.length} món</Text>
        ) : null}
      </View>
      <View style={styles.body}>
        {group.lines.map((line) => (
          <OrderLine key={line.productId} line={line} />
        ))}
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Phí vận chuyển</Text>
          <Text style={fee?.isSuccess ? styles.feeValue : styles.feeLabel}>
            {feeText(fee)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  title: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  count: { ...textStyles.caption, color: colors.textSecondary },
  body: { padding: spacing.lg, gap: spacing.md },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  faded: { opacity: 0.5 },
  thumb: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  name: { flex: 1, ...textStyles.body, color: colors.text },
  price: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  struck: { textDecorationLine: "line-through", color: colors.textSecondary },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  feeLabel: { ...textStyles.body, color: colors.textSecondary },
  feeValue: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
