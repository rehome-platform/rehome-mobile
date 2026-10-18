import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, spacing, textStyles } from "@/theme";
import { ProductCard } from "./ProductCard";

// Hàng ngang "Sản phẩm tương tự". Không có món nào → ẩn cả khối
export function SimilarProducts({ products }) {
  if (!products?.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sản phẩm tương tự</Text>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={styles.card}
            onPress={() => router.push(`/products/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingVertical: spacing.lg },
  title: {
    ...textStyles.heading,
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg },
  card: { width: 140 },
});
