import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/ui/MoneyField";
import { TextField } from "@/components/ui/TextField";
import { formatVnd } from "@/utils/money";
import { RECONSIGN_LIMITS } from "@/constants/consignment";

// Thương lượng giá ký gửi lại (đặc tả 27/11):
// mode "counter" — đề xuất giá khác cho biên nhận ReHome vừa đề xuất (còn roundsLeft lần)
// mode "decline" — không đồng ý giá → chuyển sang nhận lại hàng miễn phí (không đổi lại được)
// onSubmit({ price, note }) | onSubmit({ reason }). error: lỗi BE (giữ hộp mở để sửa)
export function ReconsignActionModal({
  visible,
  mode,
  product,
  proposedPrice,
  roundsLeft,
  pickupDays = 7,
  loading,
  error,
  onCancel,
  onSubmit,
}) {
  const [price, setPrice] = useState();
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState(null);

  // Mỗi lần mở: xoá dữ liệu cũ
  useEffect(() => {
    if (!visible) return;
    setPrice(undefined);
    setNote("");
    setFieldError(null);
  }, [visible, mode]);

  const counter = mode === "counter";

  const submit = () => {
    if (!counter) return onSubmit({ reason: note.trim() });
    if (!price || price < RECONSIGN_LIMITS.MIN_PRICE)
      return setFieldError(
        `Nhập giá từ ${formatVnd(RECONSIGN_LIMITS.MIN_PRICE)} trở lên`,
      );
    if (proposedPrice != null && price === Number(proposedPrice))
      return setFieldError(
        "Giá này bằng giá ReHome đề xuất — bấm Xác nhận biên nhận thay vì đề xuất lại",
      );
    onSubmit({ price, note: note.trim() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {counter ? "Đề xuất giá khác" : "Không đồng ý giá?"}
            </Text>

            {counter ? (
              <>
                <View style={styles.hints}>
                  {proposedPrice != null ? (
                    <Hint label="ReHome đề xuất" value={formatVnd(proposedPrice)} />
                  ) : null}
                  {product?.currentPrice != null ? (
                    <Hint
                      label="Giá cuối kỳ trước (chưa bán được)"
                      value={formatVnd(product.currentPrice)}
                    />
                  ) : null}
                </View>
                <MoneyField
                  label="Giá bạn muốn bán"
                  value={price}
                  onChange={(v) => {
                    setPrice(v);
                    setFieldError(null);
                  }}
                  error={fieldError}
                  placeholder="VD 120.000"
                />
                <TextField
                  label="Ghi chú cho ReHome (không bắt buộc)"
                  multiline
                  value={note}
                  onChangeText={setNote}
                  maxLength={RECONSIGN_LIMITS.NOTE_MAX}
                  placeholder="VD: món còn mới, mình muốn giữ giá cao hơn một chút"
                  helper={`${note.length} / ${RECONSIGN_LIMITS.NOTE_MAX} ký tự`}
                />
                <Text style={styles.muted}>
                  Giá thấp hơn thường bán nhanh hơn. ReHome sẽ chấp nhận, đề xuất
                  giá khác hoặc giữ giá trong khoảng{" "}
                  {RECONSIGN_LIMITS.MODERATOR_RESPONSE_DAYS} ngày; sau đó bạn
                  xác nhận biên nhận lần cuối.{" "}
                  <Text style={styles.bold}>
                    Bạn còn {roundsLeft} lần đề xuất.
                  </Text>
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.text}>
                  Biên nhận mới bị huỷ và món chuyển sang{" "}
                  <Text style={styles.bold}>nhận lại hàng miễn phí</Text>: đến{" "}
                  {product?.warehouseName ?? "địa điểm ký gửi"} trong{" "}
                  {pickupDays} ngày, đọc mã Member tại quầy. Bạn cũng có thể
                  quyên góp món này thay vì đến lấy.
                </Text>
                <Text style={styles.warn}>
                  Lựa chọn này không đổi lại được. Muốn thương lượng thêm thì
                  bấm Huỷ rồi Nhắn ReHome hoặc Đề xuất giá khác.
                </Text>
                <TextField
                  label="Lý do (không bắt buộc)"
                  multiline
                  value={note}
                  onChangeText={setNote}
                  maxLength={RECONSIGN_LIMITS.NOTE_MAX}
                  placeholder="VD: giá đề xuất thấp quá"
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title="Huỷ"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={styles.flex}
            />
            <Button
              title={counter ? "Gửi đề xuất" : "Không đồng ý"}
              onPress={submit}
              loading={loading}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Hint({ label, value }) {
  return (
    <View style={styles.hintRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.bold}>{value}</Text>
    </View>
  );
}

// "Xác nhận trước 14:00 04/12"
export const fmtDeadline = (v) => (v ? dayjs(v).format("HH:mm DD/MM") : "");

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    maxHeight: "90%",
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  body: { gap: spacing.md, padding: spacing.lg },
  title: { ...textStyles.heading, fontSize: 18, color: colors.text },
  hints: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  hintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  bold: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  warn: { ...textStyles.body, color: colors.error },
  error: { ...textStyles.caption, color: colors.error },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  flex: { flex: 1 },
});
