import { Modal, StyleSheet, Text, View, Alert } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { ordersApi } from "../api/ordersApi";
import { returnDeadlineOf } from "../utils/orderRules";
import { useOrderMutation } from "../hooks/useOrders";
import { router } from "expo-router";

// Theo BE (OrderServiceImpl.confirmReceipt, ReturnRequestServiceImpl): xác nhận = COMPLETED,
// tiền người ký gửi giữ tới hết hạn trả hàng, nên đơn COMPLETED vẫn trả được trong hạn
const pointsOf = (deadline) => [
  "Đơn chuyển sang Hoàn thành ngay lập tức.",
  deadline
    ? `Bạn vẫn trả hàng được tới ${deadline.format("DD/MM HH:mm")}.`
    : "Bạn vẫn trả hàng được trong 3 ngày kể từ khi giao.",
  "Hết hạn trả hàng, tiền mới được chuyển cho người ký gửi.",
];

// BR-13 · Xác nhận đã nhận hàng. order: chi tiết (items) hoặc dòng danh sách (firstItem). Đóng = onClose
export function ConfirmReceiptDialog({ order, onClose }) {
  const confirm = useOrderMutation(ordersApi.confirmReceipt);
  if (!order) return null;
  const itemName = order.items?.[0]?.name ?? order.firstItem?.name;

  const submit = () =>
    confirm.mutate(order.id, {
      onSuccess: () => {
        onClose();
        showToast("Đã xác nhận nhận hàng");
        // Hỏi ngay lúc trải nghiệm còn mới (thông lệ Shopee) — không bắt buộc
        Alert.alert(
          "Chấm dịch vụ của ReHome?",
          "Mất vài giây, giúp ReHome đóng gói và giao tốt hơn.",
          [
            { text: "Để sau", style: "cancel" },
            {
              text: "Đánh giá",
              onPress: () => router.push(`/orders/${order.id}/rating`),
            },
          ],
        );
      },

      onError: (e) => {
        onClose(); // 409: đơn đã tự hoàn thành / chưa giao → màn tự tải lại
        showToast(e.message);
      },
    });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.head}>
            <Text style={styles.title}>Xác nhận đã nhận hàng?</Text>
            <Text style={styles.muted}>
              Chỉ bấm khi bạn đã mở gói và kiểm tra món hàng.
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemName} numberOfLines={2}>
              {itemName}
            </Text>
            <Text style={styles.muted}>
              {order.orderNo} · {formatVnd(order.totalAmount)}
            </Text>
          </View>

          <View style={styles.points}>
            {pointsOf(returnDeadlineOf(order)).map((text, i) => (
              <View key={text} style={styles.point}>
                <Text style={styles.num}>{i + 1}</Text>
                <Text style={styles.text}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            Hàng có vấn đề thì chọn "Để sau" rồi bấm Trả hàng. Không bấm gì
            thì hệ thống tự hoàn thành đơn sau 3 ngày kể từ khi giao.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Để sau"
              variant="secondary"
              onPress={onClose}
              style={styles.flex}
            />
            <Button
              title="Xác nhận"
              loading={confirm.isPending}
              onPress={submit}
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dialog: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  head: { gap: spacing.xs, padding: spacing.lg },
  title: { ...textStyles.heading, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  item: {
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral,
  },
  itemName: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  points: { gap: spacing.sm, padding: spacing.lg },
  point: { flexDirection: "row", gap: spacing.sm },
  num: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.primary,
    textAlign: "center",
    ...textStyles.caption,
    lineHeight: 20,
    color: colors.text,
  },
  text: { flex: 1, ...textStyles.body, color: colors.text },
  note: {
    ...textStyles.caption,
    color: colors.textSecondary,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
