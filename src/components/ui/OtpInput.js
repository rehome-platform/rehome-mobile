import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";

// 6 ô hiển thị + MỘT TextInput ẩn phủ lên trên.
// Cách này giúp: gõ liên tục không phải nhảy ô, xoá lùi tự nhiên, dán cả mã 6 số một lần.
export function OtpInput({
  value,
  onChange,
  length = 6,
  error = false,
  autoFocus = true,
  editable = true,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split("");

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const active = focused && i === Math.min(value.length, length - 1); // ô đang chờ nhập
        return (
          <View
            key={i}
            style={[
              styles.cell,
              active && styles.cellActive,
              error && styles.cellError,
            ]}
          >
            <Text style={styles.digit}>{digits[i] ?? ""}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, length))} // chỉ giữ số, tối đa 6
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={`Ô nhập mã ${length} số`}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  cell: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  cellActive: { borderColor: colors.primary },
  cellError: { borderColor: colors.error },
  digit: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
  },
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: 0 }, // phủ kín 6 ô, trong suốt
});
