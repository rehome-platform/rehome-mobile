import { useEffect, useRef, useState } from "react";
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
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVnd } from "@/utils/money";
import { VOUCHER_TYPE_LABEL } from "@/constants/membership";
import { shortVnd } from "../utils/membershipRules";
import { VoucherCode, VoucherTicket } from "./VoucherTicket";

// Mã giảm NHIỀU nhất (bằng nhau → mã hết hạn sớm hơn, dùng trước kẻo phí)
function bestVoucher(usable) {
  return usable.reduce((best, v) => {
    if (!best) return v;
    const d = Number(v.discountAmount) - Number(best.discountAmount);
    if (d !== 0) return d > 0 ? v : best;
    return dayjs(v.expiresAt).isBefore(best.expiresAt) ? v : best;
  }, null);
}

// M-07 · Bottom sheet chọn mã giảm giá ở màn đặt hàng. Một lần thanh toán dùng 1 mã (radio).
// Số tiền giảm là của BE (GET /vouchers/applicable) — app không tự tính. Có "Không dùng mã" để bỏ chọn.
// Mã giảm nhiều nhất gắn nhãn "Tiết kiệm nhất" và được CHỌN SẴN lần đầu mở (người dùng vẫn phải bấm Áp dụng);
// đã từng bấm Áp dụng (kể cả "Không dùng mã") thì mở lại giữ đúng lựa chọn đó.
// query: kết quả useApplicableVouchers; value: id mã đang chọn; onApply(id | null)
export function VoucherPickerSheet({ visible, onClose, query, value, onApply }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(value ?? null);
  const applied = useRef(false); // đã từng bấm Áp dụng → không tự chọn sẵn nữa

  const list = query.data?.vouchers ?? [];
  const usable = list.filter((v) => v.applicable);
  const notUsable = list.filter((v) => !v.applicable);
  const best = usable.length > 1 ? bestVoucher(usable) : null;
  const preselect = value ?? (applied.current ? null : (bestVoucher(usable)?.id ?? null));

  useEffect(() => {
    if (visible) setPicked(preselect); // mở lại → bắt đầu từ mã đang áp (lần đầu: mã tiết kiệm nhất)
  }, [visible, preselect]);

  const apply = (id) => {
    applied.current = true;
    onApply(id);
  };

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
            <Button title="Tiếp tục không dùng mã" variant="secondary" onPress={() => apply(null)} />
          </>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              <Pressable
                onPress={() => setPicked(null)}
                accessibilityRole="radio"
                accessibilityState={{ checked: picked == null }}
                style={[styles.none, picked == null && styles.noneOn]}
              >
                <Radio on={picked == null} />
                <Text style={styles.noneText}>Không dùng mã</Text>
              </Pressable>

              {usable.length ? (
                <Text style={styles.group}>DÙNG ĐƯỢC · {usable.length}</Text>
              ) : null}
              {usable.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setPicked(v.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked === v.id }}
                  accessibilityLabel={`${v.name}, giảm ${formatVnd(v.discountAmount)}`}
                >
                  <VoucherTicket
                    headline={shortVnd(v.discountAmount)}
                    kind={VOUCHER_TYPE_LABEL[v.type]}
                    selected={picked === v.id}
                    notchColor={colors.surface}
                  >
                    <View style={styles.row}>
                      <View style={styles.flex}>
                        {best?.id === v.id ? (
                          <View style={styles.bestTag}>
                            <Text style={styles.bestText}>Tiết kiệm nhất</Text>
                          </View>
                        ) : null}
                        <Text style={styles.name} numberOfLines={2}>
                          {v.name}
                        </Text>
                        <Text style={styles.saving}>
                          Giảm {formatVnd(v.discountAmount)} cho lần đặt này
                        </Text>
                      </View>
                      <Radio on={picked === v.id} />
                    </View>
                    <View style={styles.row}>
                      <VoucherCode code={v.code} />
                      {v.expiresAt ? (
                        <Text style={styles.line}>HSD {dayjs(v.expiresAt).format("DD/MM")}</Text>
                      ) : null}
                    </View>
                  </VoucherTicket>
                </Pressable>
              ))}

              {notUsable.length ? (
                <Text style={styles.group}>CHƯA ĐỦ ĐIỀU KIỆN · {notUsable.length}</Text>
              ) : null}
              {notUsable.map((v) => (
                <VoucherTicket
                  key={v.id}
                  kind={VOUCHER_TYPE_LABEL[v.type]}
                  muted
                  notchColor={colors.surface}
                >
                  <Text style={[styles.name, styles.muted]} numberOfLines={2}>
                    {v.name}
                  </Text>
                  <Text style={styles.reason}>
                    {v.reason ?? "Không áp dụng cho đơn này"}
                  </Text>
                  <VoucherCode code={v.code} muted />
                </VoucherTicket>
              ))}
            </ScrollView>
            <Button title="Áp dụng" onPress={() => apply(picked)} />
          </>
        )}
      </View>
    </Modal>
  );
}

function Radio({ on }) {
  return (
    <Ionicons
      name={on ? "radio-button-on" : "radio-button-off"}
      size={22}
      color={on ? colors.primary : colors.textSecondary}
    />
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
  none: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  noneOn: { borderColor: colors.primary },
  noneText: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  bestTag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  bestText: { ...textStyles.label, fontFamily: fonts.bold, color: colors.text }, // chữ đậm trên cam: đủ tương phản
  name: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  saving: { ...textStyles.caption, fontFamily: fonts.semibold, color: colors.primary },
  line: { ...textStyles.caption, color: colors.textSecondary },
  reason: { ...textStyles.caption, color: tones.warning.fg },
  muted: { color: colors.textSecondary },
});
