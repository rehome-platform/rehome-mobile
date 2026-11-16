import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVnd } from "@/utils/money";

// M-07 · Bottom sheet chọn mã giảm giá ở màn đặt hàng. Một lần thanh toán dùng 1 mã (radio).
// Số tiền giảm là của BE (GET /vouchers/applicable) — app không tự tính. Có "Không dùng mã" để bỏ chọn.
// query: kết quả useApplicableVouchers; value: id mã đang chọn; onApply(id | null)
export function VoucherPickerSheet({ visible, onClose, query, value, onApply }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(value ?? null);
  useEffect(() => {
    if (visible) setPicked(value ?? null); // mở lại → bắt đầu từ mã đang áp
  }, [visible]);

  const list = query.data?.vouchers ?? [];
  const usable = list.filter((v) => v.applicable);
  const notUsable = list.filter((v) => !v.applicable);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={styles.title}>Chọn mã giảm giá</Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {query.isPending ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : query.isError ? (
          <ErrorBox message={query.error.message}>
            <Button title="Thử lại" variant="secondary" onPress={() => query.refetch()} />
          </ErrorBox>
        ) : !usable.length && !notUsable.length ? (
          <>
            <EmptyState
              icon="pricetags-outline"
              title="Không có mã nào dùng được cho đơn này"
              description="Bạn chưa có voucher, hoặc đơn hiện tại chưa đạt điều kiện áp dụng."
            />
            <Button title="Tiếp tục không dùng mã" variant="secondary" onPress={() => onApply(null)} />
          </>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              <Option
                title="Không dùng mã"
                selected={picked == null}
                onPress={() => setPicked(null)}
              />
              {usable.length ? (
                <Text style={styles.group}>DÙNG ĐƯỢC · {usable.length}</Text>
              ) : null}
              {usable.map((v) => (
                <Option
                  key={v.id}
                  title={v.name}
                  lines={[
                    `Giảm ${formatVnd(v.discountAmount)} cho lần đặt này`,
                    `Mã ${v.code}${v.expiresAt ? ` · HSD ${dayjs(v.expiresAt).format("DD/MM")}` : ""}`,
                  ]}
                  highlight={0}
                  selected={picked === v.id}
                  onPress={() => setPicked(v.id)}
                />
              ))}
              {notUsable.length ? (
                <Text style={styles.group}>CHƯA ĐỦ ĐIỀU KIỆN · {notUsable.length}</Text>
              ) : null}
              {notUsable.map((v) => (
                <Option
                  key={v.id}
                  title={v.name}
                  lines={[v.reason ?? "Không áp dụng cho đơn này", `Mã ${v.code}`]}
                  disabled
                />
              ))}
            </ScrollView>
            <Button title="Áp dụng" onPress={() => onApply(picked)} />
          </>
        )}
      </View>
    </Modal>
  );
}

function Option({ title, lines = [], highlight, selected, disabled, onPress }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected, disabled: !!disabled }}
      style={[styles.option, selected && styles.optionOn, disabled && styles.optionOff]}
    >
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={20}
        color={disabled ? colors.disabled : selected ? colors.primary : colors.textSecondary}
      />
      <View style={styles.optionBody}>
        <Text style={[styles.optionTitle, disabled && styles.muted]}>{title}</Text>
        {lines.map((l, i) => (
          <Text
            key={i}
            style={[styles.optionLine, i === highlight && !disabled && styles.saving]}
          >
            {l}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    maxHeight: "80%",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { ...textStyles.heading, color: colors.text },
  loading: { marginVertical: spacing.xl },
  scroll: { flexGrow: 0 },
  list: { gap: spacing.sm, paddingBottom: spacing.sm },
  group: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  option: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  optionOn: { borderColor: colors.primary },
  optionOff: { backgroundColor: colors.background },
  optionBody: { flex: 1, gap: 2 },
  optionTitle: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  optionLine: { ...textStyles.caption, color: colors.textSecondary },
  saving: { fontFamily: fonts.semibold, color: colors.primary },
  muted: { color: colors.textSecondary },
});
