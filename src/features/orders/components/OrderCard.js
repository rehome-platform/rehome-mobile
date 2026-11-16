import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { formatVnd } from "@/utils/money";
import { formatCountdown } from "@/hooks/useCountdown";
import { ORDER_STATUS as S } from "@/constants/order";
import { useSecondsLeft } from "../hooks/useSecondsLeft";
import { toDate } from "../utils/time";
import { formatTimeLeft, returnDeadlineOf } from "../utils/orderRules";
import { canRequestReturn } from "@/features/returns/utils/returnRules";
import { OrderStatusBadge } from "./OrderStatusBadge";

// Đơn cần Member làm gì → viền đậm (như wireframe)
const NEEDS_ACTION = [S.PENDING_PAYMENT, S.DELIVERED];

// Chờ thanh toán: đếm ngược theo paymentDeadline của BE; hết giờ → ẩn nút
function PendingFooter({ order, onPay }) {
  const left = useSecondsLeft(
    order.paymentDeadline ? toDate(order.paymentDeadline).valueOf() : 0,
  );
  if (left === 0)
    return (
      <Text style={styles.muted}>Đã hết hạn thanh toán — đơn sẽ tự huỷ</Text>
    );
  return (
    <>
      <Text style={styles.strong}>
        Còn {formatCountdown(left)} để thanh toán
      </Text>
      <Button title="Thanh toán" onPress={onPay} style={styles.action} />
    </>
  );
}

// Dòng cuối thẻ: chữ + nút theo trạng thái (PHASE4_GUIDE mục 7 BR-10).
// Đã giao mà còn hạn trả → thêm nút "Trả hàng" ngay trên thẻ (giống Shopee, Lazada).
// Đã giao / Hoàn thành mà còn hạn 3 ngày thì có nút Trả hàng (tiền người ký gửi giữ tới hết hạn).
// Không có "Mua lại": hàng ký gửi là món duy nhất, đã bán là hết
function Footer({ order, onPay, onTrack, onConfirm, onRate, onReturn }) {
  const returnable = canRequestReturn(order);
  const returnBtn = returnable ? (
    <Button
      title="Trả hàng"
      variant="secondary"
      onPress={onReturn}
      style={styles.action}
    />
  ) : null;

  switch (order.status) {
    case S.PENDING_PAYMENT:
      return <PendingFooter order={order} onPay={onPay} />;
    case S.PAID:
    case S.PACKING:
      return <Text style={styles.muted}>ReHome đang chuẩn bị hàng</Text>;
    case S.SHIPPING:
      return (
        <>
          <Text style={styles.muted}>
            GHN
            {order.expectedDeliveryDate
              ? ` · dự kiến ${toDate(order.expectedDeliveryDate).format("DD/MM")}`
              : ""}
          </Text>
          <Button
            title="Theo dõi"
            variant="secondary"
            onPress={onTrack}
            style={styles.action}
          />
        </>
      );
    case S.DELIVERED:
      return (
        <>
          <Text style={styles.muted}>
            {returnable
              ? `Trả hàng trước ${returnDeadlineOf(order).format("DD/MM HH:mm")}`
              : `Tự hoàn thành sau ${formatTimeLeft(order.autoCompleteDeadline)}`}
          </Text>
          <View style={styles.actions}>
            {returnBtn}
            <Button
              title="Đã nhận hàng"
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </>
      );
    case S.COMPLETED:
      // Còn hạn trả hàng thì ưu tiên nút Trả hàng; đánh giá làm trong chi tiết đơn
      if (returnable)
        return (
          <>
            <Text style={styles.muted}>
              {`Trả hàng trước ${returnDeadlineOf(order).format("DD/MM HH:mm")}`}
            </Text>
            {returnBtn}
          </>
        );
      return order.serviceRating != null ? (
        <Text style={styles.muted}>
          ★ {order.serviceRating}/5 · Đã đánh giá
        </Text>
      ) : (
        <>
          <Text style={styles.muted}>Đơn đã hoàn thành</Text>
          <Button
            title="Đánh giá"
            variant="secondary"
            onPress={onRate}
            style={styles.action}
          />
        </>
      );
    case S.CANCELLED:
      return (
        <Text style={styles.muted}>
          {order.refundAmount
            ? `Đã hoàn ${formatVnd(order.refundAmount)} vào ví của bạn`
            : "Đơn đã huỷ"}
        </Text>
      );
    default:
      return null;
  }
}

// Thẻ đơn ở BR-10: mã đơn · kho · nhãn trạng thái → món đầu (+ "và n món khác") → dòng cuối theo trạng thái
export function OrderCard({ order, onPress, ...actions }) {
  const first = order.firstItem;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${order.orderNo}`}
      style={({ pressed }) => [
        styles.card,
        NEEDS_ACTION.includes(order.status) && styles.cardStrong,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.headText} numberOfLines={1}>
          {order.orderNo} · {order.warehouseName}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>

      {first ? (
        <View style={styles.body}>
          <View style={styles.thumb}>
            {first.thumbnailUrl ? (
              <Image
                source={{ uri: first.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <Ionicons
                name="shirt-outline"
                size={22}
                color={colors.textSecondary}
              />
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {first.name}
            </Text>
            <Text style={styles.strong}>{formatVnd(first.price)}</Text>
            {order.itemCount > 1 ? (
              <Text style={styles.muted}>
                và {order.itemCount - 1} món khác
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      {order.returnRequestId ? (
        <Text style={styles.muted}>↩ Có yêu cầu trả hàng</Text>
      ) : null}

      {order.itemCount > 1 ? (
        <Text style={styles.total}>Tổng {formatVnd(order.totalAmount)}</Text>
      ) : null}

      <View style={styles.footer}>
        <Footer order={order} {...actions} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  pressed: { opacity: 0.85 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  headText: { flex: 1, ...textStyles.caption, color: colors.textSecondary },
  body: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  info: { flex: 1, gap: 2 },
  name: { ...textStyles.body, color: colors.text },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { flexShrink: 1, ...textStyles.caption, color: colors.textSecondary },
  total: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textAlign: "right",
  },
  footer: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { minHeight: 36, paddingHorizontal: spacing.md },
});
