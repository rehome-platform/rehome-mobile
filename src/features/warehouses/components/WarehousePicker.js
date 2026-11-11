import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { Button } from "@/components/ui/Button";
import { useWarehouses } from "@/features/warehouses/hooks/useWarehouses";
import { WarehouseOption } from "@/features/warehouses/components/WarehouseOption";

// Chọn kho ReHome — dùng chung KG-03 (Member, chọn một) và OC-02/OC-04 (Tổ chức, chọn nhiều).
// - Chọn một:  value = id,    onChange(id, warehouse)
// - multiple:  value = ids[], onChange(ids, warehouses)
// nearest: xếp theo vị trí (chỉ Member). autoSelectFirst: chọn sẵn kho đầu khi danh sách về (chỉ chọn một).
// lockedIds: kho không bỏ chọn được (+ lockedNote). note: khối ghi chú cuối danh sách
export function WarehousePicker({
  value,
  onChange,
  multiple = false,
  nearest = false,
  autoSelectFirst = false,
  lockedIds = [],
  lockedNote,
  note,
}) {
  const { query: warehouses, coords } = useWarehouses({ nearest });

  useEffect(() => {
    if (autoSelectFirst && !multiple && !value && warehouses.data?.length)
      onChange(warehouses.data[0].id, warehouses.data[0]);
  }, [autoSelectFirst, multiple, value, warehouses.data, onChange]);

  if (coords === undefined || warehouses.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>
          {nearest
            ? "Đang tìm địa điểm ký gửi gần bạn…"
            : "Đang tải danh sách địa điểm ký gửi…"}
        </Text>
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

  const selectedIds = multiple ? (value ?? []) : [value];
  const toggle = (w) => {
    if (!multiple) return onChange(w.id, w);
    const ids = selectedIds.includes(w.id)
      ? selectedIds.filter((id) => id !== w.id)
      : [...selectedIds, w.id];
    onChange(
      ids,
      warehouses.data.filter((x) => ids.includes(x.id)),
    );
  };

  return (
    <View style={styles.wrapper}>
      {nearest && coords === null ? (
        <NoteBox>
          Bật quyền vị trí cho ReHome để xếp địa điểm gần bạn lên đầu. Bạn vẫn
          chọn địa điểm bình thường được.
        </NoteBox>
      ) : null}
      <Text style={styles.section}>
        {coords ? "GẦN BẠN NHẤT" : "DANH SÁCH ĐỊA ĐIỂM"}
      </Text>
      {warehouses.data.map((w) => {
        const locked = lockedIds.includes(w.id);
        return (
          <WarehouseOption
            key={w.id}
            warehouse={w}
            multiple={multiple}
            selected={selectedIds.includes(w.id)}
            disabled={locked}
            disabledNote={lockedNote}
            onPress={() => toggle(w)}
          />
        );
      })}
      {note ? <NoteBox>{note}</NoteBox> : null}
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
});
