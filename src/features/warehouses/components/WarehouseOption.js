import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// 2.3 → "2,3 km" (dấu phẩy thập phân kiểu Việt)
const formatKm = (km) => `${km.toFixed(1).replace(".", ",")} km`;

// Một kho trong WarehousePicker. multiple: ô tích vuông (chọn nhiều); không thì nút tròn (chọn một).
// disabled: mờ, không bấm được (vd kho đã có đơn chờ lấy khi sửa chiến dịch) + dòng lý do disabledNote
export function WarehouseOption({
  warehouse,
  selected,
  multiple = false,
  disabled = false,
  disabledNote,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {multiple ? (
        <View style={[styles.box, selected && styles.boxSelected]}>
          {selected ? (
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
          ) : null}
        </View>
      ) : (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.name}>{warehouse.name}</Text>
          {warehouse.distanceKm != null ? (
            <Text
              style={[styles.distance, selected && styles.distanceSelected]}
            >
              {formatKm(warehouse.distanceKm)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.address}>{warehouse.address}</Text>
        {warehouse.openingHours ? (
          <Text style={styles.hours}>Mở cửa {warehouse.openingHours}</Text>
        ) : null}
        {disabled && disabledNote ? (
          <Text style={styles.disabledNote}>{disabledNote}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2, // luôn dày 2 → chọn/bỏ chọn không "nhảy" kích thước (giống RadioCard)
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  radio: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  // Cùng kích thước / màu với ô tích của Checkbox
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: radius.input / 3,
    backgroundColor: colors.surface,
  },
  boxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  body: { flex: 1, gap: 2 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  distance: { ...textStyles.body, color: colors.textSecondary },
  distanceSelected: { fontFamily: fonts.semibold, color: colors.text },
  address: { ...textStyles.caption, color: colors.textSecondary },
  hours: { ...textStyles.caption, color: colors.textSecondary },
  disabledNote: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});
