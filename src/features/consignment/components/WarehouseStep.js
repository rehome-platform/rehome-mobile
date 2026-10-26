import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { Button } from "@/components/ui/Button";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";

// Hết thời gian chờ GPS (máy tắt định vị có thể treo rất lâu)
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);

// Xin quyền vị trí (chỉ khi đang mở app) → toạ độ. Từ chối / lỗi GPS → null (vẫn chọn kho được)
async function getCoords() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  const last = await Location.getLastKnownPositionAsync(); // nhanh, đủ chính xác để xếp kho
  const pos =
    last ??
    (await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      10000,
    ));
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

// 2.3 → "2,3 km" (dấu phẩy thập phân kiểu Việt)
const formatKm = (km) => `${km.toFixed(1).replace(".", ",")} km`;

function WarehouseOption({ warehouse, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.optionBody}>
        <View style={styles.optionHead}>
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
      </View>
    </Pressable>
  );
}

// KG-03: chọn kho tiếp nhận. value/onChange = warehouseId
export function WarehouseStep({ value, onChange }) {
  const [coords, setCoords] = useState(undefined); // undefined = đang lấy vị trí; null = không có
  useEffect(() => {
    let alive = true; // rời màn trước khi có vị trí → không set state nữa
    getCoords()
      .catch(() => null)
      .then((c) => alive && setCoords(c));
    return () => {
      alive = false;
    };
  }, []);

  const warehouses = useQuery({
    queryKey: consignKeys.warehouses(coords?.lat, coords?.lng),
    queryFn: () => consignmentApi.getNearestWarehouses(coords ?? {}),
    enabled: coords !== undefined, // chờ có kết quả vị trí (kể cả null) rồi mới gọi
  });

  // Chọn sẵn kho đầu tiên (gần nhất) khi danh sách về
  useEffect(() => {
    if (!value && warehouses.data?.length) onChange(warehouses.data[0].id);
  }, [value, warehouses.data, onChange]);

  if (coords === undefined || warehouses.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Đang tìm địa điểm ký gửi gần bạn…</Text>
      </View>
    );
  }

  if (warehouses.isError) {
    return (
      <ErrorBox message={warehouses.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => warehouses.refetch()}
        />
      </ErrorBox>
    );
  }

  return (
    <View style={styles.wrapper}>
      {coords === null ? (
        <NoteBox>
          Bật quyền vị trí cho ReHome để xếp địa điểm gần bạn lên đầu. Bạn vẫn chọn
          địa điểm bình thường được.
        </NoteBox>
      ) : null}
      <Text style={styles.section}>
        {coords ? "GẦN BẠN NHẤT" : "DANH SÁCH ĐỊA ĐIỂM"}
      </Text>
      {warehouses.data.map((w) => (
        <WarehouseOption
          key={w.id}
          warehouse={w}
          selected={w.id === value}
          onPress={() => onChange(w.id)}
        />
      ))}
      <NoteBox>
        <Text style={styles.note}>
          Sau khi ReHome duyệt yêu cầu, bạn có <Text style={styles.bold}>7 ngày</Text>{" "}
          để mang đồ đến đúng địa điểm này. Quá hạn thì yêu cầu tự huỷ.
        </Text>
      </NoteBox>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  loading: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: { ...textStyles.body, color: colors.textSecondary },
  section: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
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
  optionBody: { flex: 1, gap: 2 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
  note: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
