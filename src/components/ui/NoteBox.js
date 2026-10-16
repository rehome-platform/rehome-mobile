import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, textStyles } from "@/theme";

// Khung ghi chú viền đứt (wireframe dùng nhiều). children: chuỗi, hoặc <Text> tự định dạng (in đậm một phần…)
export function NoteBox({ children, style }) {
  return (
    <View style={[styles.box, style]}>
      {typeof children === "string" ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  text: { ...textStyles.body, color: colors.textSecondary },
});
