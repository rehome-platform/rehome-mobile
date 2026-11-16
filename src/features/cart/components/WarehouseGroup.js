import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Checkbox } from "@/components/ui/Checkbox";
import { CartItemRow } from "./CartItemRow";

// Nhóm món theo kho (mỗi kho = 1 đơn khi đặt). Ô tích nhóm = tích/bỏ mọi món còn mua được trong kho
export function WarehouseGroup({
  group,
  isSelected,
  onToggle,
  onRemove,
  removingId,
}) {
  const availableIds = group.items
    .filter((i) => !i.unavailableReason)
    .map((i) => i.id);
  const allChecked = availableIds.length > 0 && availableIds.every(isSelected);
  const countText =
    availableIds.length === group.items.length
      ? `${group.items.length} món`
      : `${availableIds.length} món đặt được`;

  return (
    <View style={styles.group}>
      <Checkbox
        checked={allChecked}
        disabled={!availableIds.length}
        onChange={(checked) => onToggle(availableIds, checked)}
      >
        <Text style={styles.title}>
          {group.warehouseName}
          <Text style={styles.count}> · {countText}</Text>
        </Text>
      </Checkbox>
      {group.items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          checked={!item.unavailableReason && isSelected(item.id)}
          onToggle={(checked) => onToggle([item.id], checked)}
          onRemove={() => onRemove(item)}
          removing={removingId === item.id}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  count: { fontFamily: fonts.regular, color: colors.textSecondary },
});
