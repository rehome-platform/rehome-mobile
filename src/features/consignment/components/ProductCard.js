import dayjs from "dayjs";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { ORDER_STEPS, PRODUCT_VIEW } from "@/constants/consignment";
import { formatVnd } from "@/utils/money";
import {
  calcPayout,
  currentRate,
  daysLeft,
  formatRate,
  getProductView,
  productTiming,
} from "@/utils/consignment";
import { ProductBadge } from "./ProductBadge";

// Dòng thông tin theo trạng thái
function Detail({ product, view }) {
  if (view === PRODUCT_VIEW.AWAITING_DECISION) {
    return (
      <>
        <Text style={styles.urgent}>
          Còn {daysLeft(product.endOfTermDecision.deadline)} ngày để chọn cách
          xử lý
        </Text>
        <Text style={styles.sub}>Quá hạn, bạn mất quyền sở hữu món hàng</Text>
      </>
    );
  }
  if (view === PRODUCT_VIEW.PICKUP) {
    const due = product.endOfTermDecision?.pickupDeadline;
    return (
      <Text style={styles.sub}>
        Đến {product.warehouseName} nhận lại hàng
        {due ? ` trước ${dayjs(due).format("DD/MM")}` : ""} · đọc mã Member tại
        quầy
      </Text>
    );
  }
  if (view === PRODUCT_VIEW.REPRICING) {
    return (
      <Text style={styles.sub}>
        Đã chọn ký gửi lại · đang chờ kho đề xuất giá mới
      </Text>
    );
  }
  if (view === PRODUCT_VIEW.HAS_ORDER) {
    const step = ORDER_STEPS.find((s) => s.value === product.order?.status);
    return (
      <>
        <Text style={styles.price}>{formatVnd(product.currentPrice)}</Text>
        <Text style={styles.sub}>
          Đơn {product.order?.code}
          {step ? ` · ${step.label.toLowerCase()}` : ""}
        </Text>
        <Text style={styles.sub}>Tạm khoá giảm giá</Text>
      </>
    );
  }
  if (view === PRODUCT_VIEW.SELLING) {
    const t = productTiming(product);
    const rate = currentRate(product);
    return (
      <>
        <Text style={styles.price}>{formatVnd(product.currentPrice)}</Text>
        <Text style={[styles.sub, t.isLastTerm && styles.strong]}>
          Kỳ {product.currentTerm}/{t.totalTerms} · còn {t.termDaysLeft} ngày ·
          hoa hồng {formatRate(rate)}
        </Text>
        <Text style={styles.sub}>
          Dự kiến nhận{" "}
          {formatVnd(
            product.expectedPayout ?? calcPayout(product.currentPrice, rate),
          )}
        </Text>
      </>
    );
  }
  return <Text style={styles.price}>{formatVnd(product.currentPrice)}</Text>; // kết thúc
}

export function ProductCard({ product, onPress }) {
  const view = getProductView(product);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        view === PRODUCT_VIEW.AWAITING_DECISION && styles.attention,
        view === PRODUCT_VIEW.ENDED && styles.faded,
        pressed && styles.pressed,
      ]}
    >
      {product.photoUrl ? (
        <Image source={{ uri: product.photoUrl }} style={styles.thumb} />
      ) : (
        <View style={styles.thumb}>
          <Ionicons
            name="shirt-outline"
            size={24}
            color={colors.textSecondary}
          />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <ProductBadge product={product} />
        <Detail product={product} view={view} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  attention: { borderWidth: 2, borderColor: colors.error },
  faded: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  info: { flex: 1, gap: 2 },
  name: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  price: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginTop: 2,
  },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  strong: { fontFamily: fonts.semibold, color: colors.text },
  urgent: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
    marginTop: 2,
  },
});
