import { Modal, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import {
  calcPayout,
  commissionRates,
  formatRate,
  totalTermDays,
} from "@/utils/consignment";
import { KeyValueTable } from "./KeyValueTable";

// KG-07: tóm tắt số tiền trước khi xác nhận. Đang gửi thì không cho đóng
export function ReceiptConfirmModal({
  visible,
  receipt,
  loading,
  onCancel,
  onConfirm,
}) {
  const [rate1, rate2, rate3] = commissionRates(receipt);
  const days = totalTermDays(receipt);
  const endDate = dayjs().add(days, "day").format("DD/MM/YYYY"); // xác nhận hôm nay → hết hạn ngày này

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>Xác nhận biên nhận?</Text>
            <Text style={styles.desc}>
              Sau khi xác nhận, hàng được nhập kho và đăng bán ngay.{" "}
              <Text style={styles.bold}>Không thể huỷ biên nhận này.</Text>
            </Text>
          </View>

          <KeyValueTable
            bordered={false}
            rows={[
              { label: "Sản phẩm", value: receipt.productName },
              { label: "Giá bán", value: formatVnd(receipt.agreedPrice) },
              { label: "Giá sàn", value: formatVnd(receipt.floorPrice) },
              {
                label: "Hoa hồng kỳ 1",
                value: `${formatRate(rate1)} — bạn nhận ${formatVnd(calcPayout(receipt.agreedPrice, rate1))}`,
              },
              { label: "Thời hạn", value: `${days} ngày, đến ${endDate}` },
            ]}
          />

          <View style={styles.note}>
            <Text style={styles.noteText}>
              Sau khi xác nhận bạn{" "}
              <Text style={styles.bold}>
                chỉ được giảm giá, không được tăng
              </Text>
              , và không thấp hơn giá sàn.
              {rate2 != null
                ? ` Hoa hồng tăng lên ${formatRate(rate2)} ở kỳ 2`
                : ""}
              {rate3 != null ? ` và ${formatRate(rate3)} ở kỳ 3.` : "."}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Để sau"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={styles.flex}
            />
            <Button
              title="Xác nhận"
              onPress={onConfirm}
              loading={loading}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  head: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  title: { ...textStyles.heading, fontSize: 18, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  note: { padding: spacing.lg, backgroundColor: colors.background },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
