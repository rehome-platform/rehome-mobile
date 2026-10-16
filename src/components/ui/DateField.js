import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Ô chọn ngày, trông giống TextField. value / onChange dùng chuỗi "YYYY-MM-DD" (BE nhận LocalDate)
// Android: bấm là mở hộp lịch của hệ thống. iOS chưa làm (Phase 1 chỉ test Android)
export function DateField({
  label,
  required = false,
  value,
  onChange,
  helper,
  error,
  placeholder = "Chọn ngày",
  maximumDate = new Date(), // mặc định không cho chọn ngày tương lai (ngày cấp giấy tờ)
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
    // "set" = bấm OK; "dismissed" = bấm Huỷ → giữ nguyên
    if (event.type === "set" && date)
      onChange(dayjs(date).format("YYYY-MM-DD"));
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
          {value ? dayjs(value).format("DD/MM/YYYY") : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}

      {open ? (
        <DateTimePicker
          value={value ? dayjs(value).toDate() : new Date()}
          mode="date"
          maximumDate={maximumDate}
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
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
