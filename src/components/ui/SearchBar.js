import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";

// Ô tìm kiếm nằm trong màn (lọc danh sách khi gõ): kính lúp · ô nhập · nút xoá chữ.
// Cùng kiểu ô ở màn tìm sản phẩm (SearchScreen)
export function SearchBar({ value, onChangeText, placeholder, style }) {
  return (
    <View style={[styles.box, style]}>
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Xoá chữ"
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
});
