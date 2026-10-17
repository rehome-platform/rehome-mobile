import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Ô chọn 1 giá trị: trông như TextField, bấm mở danh sách trượt từ dưới lên.
// options: [{ value, label }]. searchable: có ô tìm (danh sách dài như thương hiệu)
// So khớp không phân biệt dấu: "giay" tìm ra "Giày"
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export function SelectField({
  label,
  required = false,
  placeholder = "Chọn",
  options = [],
  value,
  onChange,
  error,
  searchable = false,
  loading = false,
  style,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  const shown = useMemo(() => {
    if (!query.trim()) return options;
    const q = normalize(query.trim());
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const pick = (v) => {
    onChange(v);
    close();
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
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.box,
          { borderColor: error ? colors.error : colors.neutral },
        ]}
      >
        <Text
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {loading ? "Đang tải…" : (selected?.label ?? placeholder)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityLabel="Đóng"
        />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          {searchable ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm…"
              placeholderTextColor={colors.textSecondary}
              style={styles.search}
              autoCorrect={false}
            />
          ) : null}
          <FlatList
            data={shown}
            keyExtractor={(o) => String(o.value)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => pick(item.value)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <Text
                    style={[styles.optionText, active && styles.optionActive]}
                  >
                    {item.label}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>Không tìm thấy</Text>
            }
          />
        </View>
      </Modal>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    maxHeight: "70%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sheetTitle: { flex: 1, ...textStyles.heading, color: colors.text },
  search: {
    minHeight: 44,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    ...textStyles.body,
    fontSize: 16,
    color: colors.text,
  },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  pressed: { opacity: 0.7 },
  optionText: { flex: 1, ...textStyles.body, fontSize: 16, color: colors.text },
  optionActive: { fontFamily: fonts.semibold, color: colors.primary },
  empty: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    padding: spacing.lg,
  },
});
