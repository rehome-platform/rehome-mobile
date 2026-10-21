import { StyleSheet, TextInput, View } from "react-native";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { CHAT_LIMITS } from "@/constants/chat";

// Ô nhập cố định đáy + Gửi. Nút Ảnh / Đơn ẩn (0.5 A17)
export function ChatInput({ value, onChange, onSend }) {
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Nhập tin nhắn…"
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={CHAT_LIMITS.MAX_CHARS}
        style={styles.input}
      />
      <Button
        title="Gửi"
        disabled={!value.trim()}
        onPress={onSend}
        style={styles.send}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110, // ~4 dòng
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    ...textStyles.body,
    color: colors.text,
  },
  send: { minHeight: 44, paddingHorizontal: spacing.lg },
});
