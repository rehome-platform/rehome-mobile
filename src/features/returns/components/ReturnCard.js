import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { formatVnd } from "@/utils/money";
import { RETURN_STATUS as R } from "@/constants/returns";
import { toDate } from "@/features/orders/utils/time";
import { formatTimeLeft } from "@/features/orders/utils/orderRules";
import { needsAction } from "../utils/returnRules";
import { ReturnStatusBadge } from "./ReturnStatusBadge";

// Dòng cuối thẻ: việc Member cần làm (đậm) hoặc tình trạng hiện tại (mờ)
function nextStep(r) {
  switch (r.status) {
    case R.PENDING:
      return { text: "ReHome đang xem xét yêu cầu" };
    case R.APPROVED:
      return {
        text: `Giao hàng cho shipper trước ${toDate(r.handoverDeadline).format("DD/MM HH:mm")}`,
        strong: true,
      };
    case R.SHIPPED_BACK:
      return { text: "Hàng đang gửi về địa điểm ký gửi" };
    case R.INSPECTING:
      return { text: "ReHome đang kiểm tra hàng" };
    case R.VALID:
    case R.LOST:
      return { text: "Đã hoàn tiền vào ví của bạn" };
    case R.INVALID:
      return r.invalidReturnChoice
        ? {
            text: `Đến địa điểm lấy trước ${toDate(r.pickupDeadline).format("DD/MM")}`,
          }
        : {
            text: `Chọn cách nhận lại hàng · còn ${formatTimeLeft(r.pickupDeadline)}`,
            strong: true,
          };
    case R.CANCELLED:
      return { text: "Yêu cầu đã huỷ" };
    default:
      return null;
  }
}

// Thẻ ở danh sách yêu cầu trả: mã · đơn · nhãn → món đầu → việc cần làm
export function ReturnCard({ item: r, onPress }) {
  const first = r.firstItem;
  const step = nextStep(r);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Yêu cầu trả hàng ${r.code ?? ""}`}
      style={({ pressed }) => [
        styles.card,
        needsAction(r) && styles.cardStrong,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.headText} numberOfLines={1}>
          {[r.code, r.orderNo && `Đơn ${r.orderNo}`]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <ReturnStatusBadge status={r.status} />
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
            <Text style={styles.price}>{formatVnd(first.price)}</Text>
            {r.itemCount > 1 ? (
              <Text style={styles.muted}>và {r.itemCount - 1} món khác</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {step ? (
        <Text style={step.strong ? styles.stepStrong : styles.muted}>
          {step.text}
        </Text>
      ) : null}
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
  cardStrong: { borderWidth: 2, borderColor: colors.text },
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
  price: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  stepStrong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
