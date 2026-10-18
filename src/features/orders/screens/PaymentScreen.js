import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  BackHandler,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { MOCK } from "@/config/env";
import { ORDER_STATUS } from "@/constants/order";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { cartKeys } from "@/features/cart/api/queryKeys";
import { ordersApi } from "../api/ordersApi";
import { paymentApi } from "../api/paymentApi";
import { orderKeys } from "../api/queryKeys";
import { useSecondsLeft } from "../hooks/useSecondsLeft";
import { toDate } from "../utils/time";
import { PaymentCountdown } from "../components/PaymentCountdown";

const POLL_MS = 3000;
const POLL_WINDOW_MS = 60 * 1000; // chỉ hỏi liên tục 60 giây sau mỗi lần mở MoMo / quay lại app

// BR-09 · Chờ thanh toán → Thành công / Hết hạn
export default function PaymentScreen() {
  const storeOrders = useCheckoutStore((s) => s.pendingOrders);
  const setPendingOrders = useCheckoutStore((s) => s.setPendingOrders);
  const queryClient = useQueryClient();
  // Chụp lại lúc mở màn: kết thúc thì store bị xoá (dải ở giỏ biến mất) nhưng màn này vẫn hiện kết quả
  const [orders] = useState(storeOrders);
  const [pollUntil, setPollUntil] = useState(0);
  const [opened, setOpened] = useState(false); // đã bấm thanh toán ít nhất 1 lần
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false); // chỉ quay vòng khi người dùng bấm "Kiểm tra lại"

  const ids = orders.map((o) => o.id);
  // Trạng thái thật luôn hỏi BE — không tin kết quả trên đường quay về từ MoMo (F-057)
  const status = useQuery({
    queryKey: orderKeys.statuses(ids),
    queryFn: () => Promise.all(ids.map((id) => ordersApi.getOrder(id))),
    enabled: ids.length > 0,
    refetchInterval: () => (Date.now() < pollUntil ? POLL_MS : false),
  });
  const latest = status.data ?? orders; // hạn thanh toán lấy theo BE (mock "còn 30 giây" đổi được)
  const deadlineMs = latest.length
    ? Math.min(...latest.map((o) => toDate(o.paymentDeadline).valueOf()))
    : 0;
  const left = useSecondsLeft(deadlineMs);

  const statusOf = (id) =>
    status.data?.find((o) => o.id === id)?.status ??
    ORDER_STATUS.PENDING_PAYMENT;
  const allPaid =
    ids.length > 0 && ids.every((id) => statusOf(id) === ORDER_STATUS.PAID);
  const expired =
    !allPaid &&
    (left === 0 || ids.some((id) => statusOf(id) === ORDER_STATUS.CANCELLED));
  const done = allPaid || expired;
  const timeUp = left === 0;

  // Hết giờ → hỏi BE lần cuối (có thể vừa trả kịp)
  useEffect(() => {
    if (timeUp && ids.length) status.refetch();
  }, [timeUp]);

  // Kết thúc → xoá đơn chờ khỏi store, làm mới giỏ + sàn (món đã bán / mở bán lại)
  useEffect(() => {
    if (!done) return;
    setPendingOrders([]);
    queryClient.invalidateQueries({ queryKey: cartKeys.cart });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [done]);

  // Quay lại app (từ MoMo / app khác) → hỏi BE ngay + hỏi tiếp 60 giây
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && !done) {
        status.refetch();
        setPollUntil(Date.now() + POLL_WINDOW_MS);
      }
    });
    return () => sub.remove();
  }, [done]);

  const leave = useCallback(() => {
    if (done) return router.dismissTo("/");
    Alert.alert(
      "Rời màn thanh toán?",
      `Đơn vẫn được giữ đến ${dayjs(deadlineMs).format("HH:mm")}. Bạn có thể thanh toán tiếp từ Giỏ hàng.`,
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Rời đi", onPress: () => router.dismissTo("/cart") },
      ],
    );
  }, [done, deadlineMs]);

  // Nút Back Android → hỏi như nút ←
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      leave();
      return true;
    });
    return () => sub.remove();
  }, [leave]);

  if (!orders.length) return <Redirect href="/cart" />;

  const total = orders.reduce((s, o) => s + o.totalAmount, 0);

  if (allPaid) {
    return (
      <Result
        icon="checkmark-circle"
        iconColor={colors.success}
        title="Thanh toán thành công"
        description="Kho sẽ đóng gói và giao hàng cho bạn. Bạn sẽ nhận thông báo khi đơn được gửi đi."
        orders={orders}
      />
    );
  }
  if (expired) {
    return (
      <Result
        icon="time-outline"
        iconColor={colors.error}
        title="Đơn đã hết hạn thanh toán"
        description="Đơn đã tự huỷ và các món được mở bán lại. Nếu bạn lỡ trả tiền sau khi hết giờ, tiền sẽ được hoàn vào ví ReHome."
        orders={orders}
      />
    );
  }

  const pay = async () => {
    setPaying(true);
    try {
      const pendingIds = ids.filter(
        (id) => statusOf(id) === ORDER_STATUS.PENDING_PAYMENT,
      );
      const { payUrl } = await paymentApi.startPayment({
        orderIds: pendingIds,
      });
      setOpened(true);
      setPollUntil(Date.now() + POLL_WINDOW_MS);
      // [TẠM] nhánh feature/payment-momo đổi sang WebBrowser.openAuthSessionAsync + đường quay về app
      if (payUrl) await Linking.openURL(payUrl);
      else showToast("Bản thử: chưa nối MoMo thật — dùng nút Mock bên dưới");
    } catch (e) {
      Alert.alert("Chưa mở được MoMo", e.message);
    } finally {
      setPaying(false);
    }
  };

  const check = async () => {
    setChecking(true);
    try {
      const res = await status.refetch();
      if (!res.data?.every((o) => o.status === ORDER_STATUS.PAID)) {
        showToast("Chưa nhận được xác nhận thanh toán từ MoMo");
      }
    } finally {
      setChecking(false);
    }
  };

  const mockPay = async (ok) => {
    await paymentApi.mockPayOrders(ids, ok);
    if (!ok) showToast("Thanh toán chưa thành công, bạn có thể thử lại");
    status.refetch();
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Chờ thanh toán" onBack={leave} />}
      contentStyle={styles.content}
      footer={
        <View style={styles.footerCol}>
          <Button
            title={
              opened
                ? "Mở lại MoMo để thanh toán"
                : `Thanh toán qua MoMo · ${formatVnd(total)}`
            }
            loading={checking}
            onPress={pay}
          />
          <Button
            title="Tôi đã thanh toán — kiểm tra lại"
            variant="secondary"
            loading={status.isFetching && !paying}
            onPress={check}
          />
        </View>
      }
    >
      <PaymentCountdown seconds={left} />

      <View style={styles.holdBox}>
        <Text style={styles.holdTitle}>Sản phẩm đang được giữ cho bạn</Text>
        <Text style={styles.text}>
          Trong thời gian này không ai mua được các món của bạn. Hết giờ mà chưa
          thanh toán, đơn tự huỷ và hàng mở bán lại.
        </Text>
      </View>

      <View style={styles.table}>
        {orders.map((o, i) => (
          <View key={o.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>
                {orders.length > 1 ? `Đơn ${i + 1} — ` : ""}
                {o.warehouseName}
              </Text>
              <Text style={styles.rowSub}>
                {o.orderNo} · Tiền hàng {formatVnd(o.subtotal)} + phí ship{" "}
                {formatVnd(o.shippingFee)}
              </Text>
            </View>
            <Text style={styles.rowAmount}>{formatVnd(o.totalAmount)}</Text>
          </View>
        ))}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.rowTitle}>Tổng thanh toán</Text>
          <Text style={styles.total}>{formatVnd(total)}</Text>
        </View>
      </View>

      <NoteBox>
        Đã trả tiền mà màn hình chưa đổi? Bấm "Kiểm tra lại". Hệ thống chỉ xác
        nhận đơn khi nhận được thông báo từ MoMo, có thể chậm vài giây.
      </NoteBox>

      {__DEV__ && MOCK.payment ? (
        <NoteBox>
          <View style={styles.mock}>
            <Text style={styles.mockTitle}>Mock (chỉ bản dev)</Text>
            <Button
              title="MoMo thành công"
              variant="text"
              onPress={() => mockPay(true)}
            />
            <Button
              title="MoMo thất bại"
              variant="text"
              onPress={() => mockPay(false)}
            />
            <Button
              title="Chỉ còn 30 giây"
              variant="text"
              onPress={() => {
                ordersApi.mockShortenDeadline(ids);
                status.refetch();
              }}
            />
          </View>
        </NoteBox>
      ) : null}
    </Screen>
  );
}

// Màn kết quả (thành công / hết hạn). Wireframe chưa vẽ (PHASE3_GUIDE 0.4 #10). "Xem đơn hàng" → Phase 4
function Result({ icon, iconColor, title, description, orders }) {
  return (
    <Screen
      header={<AppHeader title="Kết quả thanh toán" />}
      footer={
        <Button
          title="Tiếp tục mua sắm"
          onPress={() => router.dismissTo("/")}
        />
      }
    >
      <View style={styles.result}>
        <Ionicons name={icon} size={72} color={iconColor} />
        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultDesc}>{description}</Text>
        <View style={styles.resultList}>
          {orders.map((o) => (
            <Text key={o.id} style={styles.text}>
              Đơn {o.orderNo} — {o.warehouseName}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  text: { ...textStyles.body, color: colors.text },
  footerCol: { gap: spacing.sm },
  holdBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  holdTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  table: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  rowSub: { ...textStyles.caption, color: colors.textSecondary },
  rowAmount: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  totalRow: {
    borderBottomWidth: 0,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  total: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
  mockTitle: { ...textStyles.label, color: colors.textSecondary },
  result: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  resultTitle: { ...textStyles.title, color: colors.text, textAlign: "center" },
  resultDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  resultList: { alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
});
