import { StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, spacing, textStyles } from "@/theme";

// BR-04 · Bảng "Thông tin sản phẩm" kiểu Shopee: nhãn trái, giá trị phải. Dòng nào BE không trả → ẩn
export function ProductInfoTable({ product }) {
  const rows = [
    ["Danh mục", product.categoryName],
    ["Thương hiệu", product.brandName],
    ["Size", product.size],
    ["Tình trạng", product.condition],
    [
      "Ngày kiểm định",
      product.inspectedAt
        ? dayjs(product.inspectedAt).format("DD/MM/YYYY")
        : null,
    ],
    ["Địa điểm ký gửi", product.warehouseName],
  ].filter(([, value]) => value);

  if (!rows.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Thông tin sản phẩm</Text>
      {rows.map(([label, value], i) => (
        <View key={label} style={[styles.row, i > 0 && styles.divider]}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  title: {
    ...textStyles.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  label: { ...textStyles.body, color: colors.textSecondary, width: 120 },
  value: {
    ...textStyles.body,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
});
