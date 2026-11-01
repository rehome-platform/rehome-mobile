import { StyleSheet, Text } from "react-native";
import { colors, fonts, textStyles } from "@/theme";
import { WarehousePicker } from "@/features/warehouses/components/WarehousePicker";

// KG-03: chọn địa điểm ký gửi (một kho, xếp gần nhất, chọn sẵn kho đầu).
// value = warehouseId; onChange(warehouseId, warehouse) — warehouse = {id, name, address, …}
export function WarehouseStep({ value, onChange }) {
  return (
    <WarehousePicker
      nearest
      autoSelectFirst
      value={value}
      onChange={onChange}
      note={
        <Text style={styles.note}>
          Sau khi ReHome duyệt yêu cầu, bạn có{" "}
          <Text style={styles.bold}>7 ngày</Text> để mang đồ đến đúng địa điểm
          này. Quá hạn thì yêu cầu tự huỷ.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  note: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
