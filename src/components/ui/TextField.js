import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

export function TextField({
  label,
  required = false,
  helper,
  error,
  secure = false, // true: ô mật khẩu, có nút ẩn/hiện
  multiline = false, // true: ô nhiều dòng (mô tả…)
  suffix, // chữ cố định cuối ô (vd "đ" ở ô tiền)
  style,
  onFocus,
  onBlur,
  ...inputProps // mọi prop còn lại (value, onChangeText, keyboardType…) chuyển thẳng cho TextInput
}) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  // Viền: lỗi → đỏ; đang nhập → xanh; bình thường → xám nhạt
  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.neutral;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputBox,
          multiline && styles.inputBoxMultiline,
          { borderColor },
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          multiline={multiline}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e); // react-hook-form cần onBlur để đánh dấu ô đã chạm
          }}
          {...inputProps}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}

        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Hiện mật khẩu" : "Ẩn mật khẩu"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  inputBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputBoxMultiline: { alignItems: "flex-start" },
  input: {
    flex: 1,
    ...textStyles.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" }, // Android: chữ bắt đầu từ trên, không nằm giữa ô
  suffix: {
    ...textStyles.body,
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
