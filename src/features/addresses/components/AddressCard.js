import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatAddress, formatPhone } from "@/utils/format";

function Action({ title, onPress, disabled, danger }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => (pressed || disabled) && styles.pressed}
    >
      <Text style={[styles.action, danger && styles.danger]}>{title}</Text>
    </Pressable>
  );
}

// Thẻ địa chỉ (BR-06). Mặc định: viền đậm + nhãn, không có nút Xoá.
// Chế độ chọn (checkout): có onPress; selected → viền xanh + dấu tích
export function AddressCard({
  address,
  onEdit,
  onSetDefault,
  onDelete,
  busy,
  onPress,
  selected,
}) {
  const isDefault = !!address.isDefault;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "radio" : undefined}
      accessibilityState={onPress ? { checked: !!selected } : undefined}
      style={[
        styles.card,
        isDefault && styles.cardDefault,
        selected && styles.cardSelected,
      ]}
    >
      <View style={styles.head}>
        {onPress ? (
          <Ionicons
            name={selected ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={selected ? colors.primary : colors.textSecondary}
          />
        ) : null}
        <Text style={styles.name} numberOfLines={1}>
          {address.recipientName}
        </Text>
        {isDefault ? <Text style={styles.badge}>MẶC ĐỊNH</Text> : null}
      </View>
      <Text style={styles.text}>{formatPhone(address.phone)}</Text>
      <Text style={styles.text}>{formatAddress(address)}</Text>

      <View style={styles.actions}>
        <Action title="Sửa" onPress={onEdit} disabled={busy} />
        {isDefault ? (
          <Text style={styles.hint}>Không xoá được địa chỉ mặc định</Text>
        ) : (
          <>
            <Action
              title="Đặt làm mặc định"
              onPress={onSetDefault}
              disabled={busy}
            />
            <Action title="Xoá" onPress={onDelete} disabled={busy} danger />
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardDefault: { borderWidth: 1, borderColor: colors.primary },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1, ...textStyles.heading, color: colors.text },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.primary,
    color: colors.surface,
    ...textStyles.label,
    fontFamily: fonts.bold,
  },
  text: { ...textStyles.body, color: colors.textSecondary },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  action: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textDecorationLine: "underline",
  },
  danger: { color: colors.error },
  hint: { ...textStyles.body, color: colors.textSecondary },
  pressed: { opacity: 0.5 },
});
