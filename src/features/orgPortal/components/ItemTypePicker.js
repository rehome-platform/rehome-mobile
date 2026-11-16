import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { CAMPAIGN_ITEM_TYPES } from "@/constants/community";

// "Loại đồ đang cần *" (OC-02): chip gợi ý chọn nhiều + "Thêm loại khác" (BE lưu chuỗi — B3).
// Loại tự nhập hiện thành chip như loại gợi ý. value = string[]
export function ItemTypePicker({ value = [], onChange, error }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const custom = value.filter((v) => !CAMPAIGN_ITEM_TYPES.includes(v));
  const options = [...CAMPAIGN_ITEM_TYPES, ...custom].map((t) => ({
    value: t,
    label: t,
  }));

  const add = () => {
    const t = text.trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase()))
      onChange([...value, t]);
    setText("");
    setAdding(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Loại đồ đang cần<Text style={styles.required}> *</Text>
      </Text>
      <ChipGroup multiple options={options} value={value} onChange={onChange} />
      {adding ? (
        <View style={styles.addRow}>
          <TextField
            style={styles.addField}
            value={text}
            onChangeText={setText}
            placeholder="Vd: Sách giáo khoa"
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={add}
          />
          <Button title="Thêm" variant="secondary" onPress={add} />
        </View>
      ) : (
        <Pressable onPress={() => setAdding(true)} hitSlop={8}>
          <Text style={styles.link}>+ Thêm loại khác</Text>
        </Pressable>
      )}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.helper}>
          Chọn càng đúng, người quyên góp càng ít mang nhầm đồ bạn không dùng
          được.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  addRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  addField: { flex: 1 },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
