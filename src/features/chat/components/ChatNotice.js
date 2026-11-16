import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, textStyles } from "@/theme";

// Cảnh báo ghim đầu phòng chat (mục 6) — khung nét đứt
export function ChatNotice({ children }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginVertical: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
  text: { ...textStyles.caption, color: colors.textSecondary },
});
