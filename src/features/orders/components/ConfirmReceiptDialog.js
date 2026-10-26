import { Modal, StyleSheet, Text, View, Alert } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { ordersApi } from "../api/ordersApi";
import { useOrderMutation } from "../hooks/useOrders";
import { router } from "expo-router";

const POINTS = [
  "Đơn chuyển sang Hoàn thành ngay lập tức.",
  "Bạn vẫn còn 3 ngày để gửi yêu cầu trả hàng nếu phát hiện vấn đề.",
  // [CHỜ LEAD/BE] thời điểm tiền vào ví người ký gửi (PHASE4_GUIDE 0.4 #7, câu 12) — giữ đúng chữ wireframe
  "Hết 3 ngày đó, tiền mới được chuyển cho người ký gửi.",
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
            {POINTS.map((text, i) => (
              <View key={text} style={styles.point}>
                <Text style={styles.num}>{i + 1}</Text>
                <Text style={styles.text}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            Không bấm cũng được — hệ thống tự hoàn thành đơn sau 3 ngày kể từ
            khi giao. Bấm sớm chỉ giúp người ký gửi nhận tiền nhanh hơn.
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
