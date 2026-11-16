import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { WarehousePicker } from "@/features/warehouses/components/WarehousePicker";
import { useWarehouses } from "@/features/warehouses/hooks/useWarehouses";

function OptionCard({ checked, title, children, right, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={({ pressed }) => [
        styles.card,
        checked && styles.cardChecked,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? (
          <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
      {right}
    </Pressable>
  );
}

// "Cách nhận đồ *" (OC-02 / OC-04, wireframe 31/10): chọn ít nhất 1 trong 2, được chọn cả hai.
// - Nhận tại địa chỉ riêng: địa chỉ + giờ nhận lấy từ hồ sơ tổ chức (chỉ đọc)
// - Nhận tại điểm ký gửi: mở danh sách kho chọn nhiều (WarehousePicker tách từ KG-03). Tích = đã chọn ≥ 1 kho
// lockedIds: kho còn đơn chờ lấy, không bỏ chọn được (OC-04)
export function ReceivingPlaceField({
  receiveAtOwnAddress,
  warehouseIds,
  onChangeOwnAddress,
  onChangeWarehouseIds,
  ownAddress,
  ownHours,
  lockedIds = [],
  error,
}) {
  const [picking, setPicking] = useState(false);
  const { query } = useWarehouses(); // cùng cache với WarehousePicker → có tên kho để hiện tóm tắt
  const names = (query.data ?? [])
    .filter((w) => warehouseIds.includes(w.id))
    .map((w) => w.name);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Cách nhận đồ<Text style={styles.required}> *</Text>
      </Text>

      <OptionCard
        checked={receiveAtOwnAddress}
        title="Nhận tại địa chỉ riêng"
        disabled={!ownAddress}
        onPress={() => onChangeOwnAddress(!receiveAtOwnAddress)}
      >
        {ownAddress ? (
          <>
            <Text style={styles.muted}>{ownAddress}</Text>
            {ownHours ? <Text style={styles.muted}>{ownHours}</Text> : null}
            <Text style={styles.hint}>
              Bạn có thể ghi note người quyên góp, không bắt buộc.
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>
            Hồ sơ tổ chức chưa có địa chỉ nhận đồ.
          </Text>
        )}
      </OptionCard>

      <OptionCard
        checked={warehouseIds.length > 0}
        title="Nhận tại điểm ký gửi"
        onPress={() => setPicking(true)}
        right={<Text style={styles.link}>Chọn địa điểm</Text>}
      >
        <Text style={styles.muted}>
          {warehouseIds.length
            ? `${warehouseIds.length} địa điểm: ${names.join(", ")}`
            : "Chưa chọn địa điểm ký gửi — bấm để chọn"}
        </Text>
        <Text style={styles.hint}>
          Nhân viên ReHome nhận đồ giúp bạn tại quầy, bạn xem danh sách đồ chờ
          lấy rồi tới lấy.
        </Text>
      </OptionCard>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.helper}>
          Chọn ít nhất 1 trong 2, có thể chọn cả hai.
        </Text>
      )}

      <Modal
        visible={picking}
        animationType="slide"
        onRequestClose={() => setPicking(false)}
      >
        <Screen
          scroll
          header={
            <AppHeader
              title="Chọn điểm ký gửi"
              onBack={() => setPicking(false)}
            />
          }
          footer={
            <Button
              title={
                warehouseIds.length
                  ? `Xong · đã chọn ${warehouseIds.length} địa điểm`
                  : "Xong"
              }
              onPress={() => setPicking(false)}
            />
          }
        >
          <WarehousePicker
            multiple
            value={warehouseIds}
            onChange={(ids) => onChangeWarehouseIds(ids)}
            lockedIds={lockedIds}
            lockedNote="Còn đồ chờ bạn tới lấy — chưa bỏ được địa điểm này."
            note="Chọn bao nhiêu địa điểm cũng được. Người quyên góp sẽ thấy địa chỉ và giờ mở cửa của từng địa điểm ký gửi."
          />
        </Screen>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2, // luôn dày 2 → tích / bỏ tích không "nhảy" kích thước
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  cardChecked: { borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
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
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  body: { flex: 1, gap: 2 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  hint: { ...textStyles.caption, color: colors.textSecondary, marginTop: 2 },
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
