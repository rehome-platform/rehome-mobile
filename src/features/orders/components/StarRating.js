import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";

// 5 sao. onChange có → chạm để chọn; không có → chỉ hiển thị
export function StarRating({ value = 0, onChange, size = 40 }) {
  return (
    <View
      style={styles.row}
      accessibilityRole={onChange ? "adjustable" : undefined}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          hitSlop={4}
          accessibilityRole={onChange ? "button" : undefined}
          accessibilityLabel={`${n} sao`}
        >
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color={n <= value ? colors.secondary : colors.textSecondary}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
});
