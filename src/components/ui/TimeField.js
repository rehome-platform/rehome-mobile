import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// "08:30" → Date hôm nay lúc 08:30 (picker cần Date). Chưa có giờ → 08:00
const toDate = (value) => {
  const [h, m] = (value || "08:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

// Ô chọn giờ, cùng kiểu với DateField. value / onChange dùng chuỗi "HH:mm" (24 giờ)
export function TimeField({
  label,
  required = false,
  value,
  onChange,
  error,
  placeholder = "--:--",
  style,
}) {
  const [open, setOpen] = useState(false);
  const borderColor = error
    ? colors.error
    : open
      ? colors.primary
      : colors.neutral;

  const handleChange = (event, date) => {
    setOpen(false);
    if (event.type === "set" && date) onChange(dayjs(date).format("HH:mm"));
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.box, { borderColor }]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          is24Hour
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  box: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  value: { flex: 1, ...textStyles.body, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
