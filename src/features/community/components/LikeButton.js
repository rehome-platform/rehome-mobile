import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";

// ♡ 48 / ♥ Đã thích · 49 (withLabel ở CD-02)
export function LikeButton({ liked, count, onPress, withLabel = false }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? "Bỏ thích" : "Thích"}
      style={styles.row}
    >
      <Ionicons
        name={liked ? "heart" : "heart-outline"}
        size={20}
        color={liked ? colors.error : colors.text}
      />
      <Text style={[styles.text, liked && styles.liked]}>
        {withLabel ? `${liked ? "Đã thích" : "Thích"} · ${count}` : count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  text: { ...textStyles.body, color: colors.text },
  liked: { fontFamily: fonts.semibold },
});
