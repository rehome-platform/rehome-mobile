import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@/constants/order";
import {
  RETURN_STATUS as R,
  SHIP_BACK_LIMITS,
  SHIP_BACK_STATUS as SB,
} from "@/constants/returns";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { PaymentMethodPicker } from "@/features/orders/components/PaymentMethodPicker";
import { PaymentCountdown } from "@/features/orders/components/PaymentCountdown";
import { useSecondsLeft } from "@/features/orders/hooks/useSecondsLeft";
import { toDate } from "@/features/orders/utils/time";
import { returnsApi } from "../api/returnsApi";
import { useReturn, useReturnMutation } from "../hooks/useReturns";

const POLL_MS = 3000;
const POLL_WINDOW_MS = 2 * 60 * 1000; // hỏi liên tục 2 phút sau khi mở / quay lại từ VNPay

// Trả phí ReHome gửi lại hàng trả không hợp lệ (/returns/<id>/ship-back-pay) — đặc tả 27/11.
// Trả trọn bằng Ví ReHome (trừ ngay) hoặc VNPay (mở trang, quay lại app thì hỏi BE shipBackStatus).
// Quá hạn 30 phút chưa trả → BE bỏ lựa chọn, người mua chọn lại cách nhận hàng
export default function ShipBackPayScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useReturn(id);
  const r = query.data;
  const [method, setMethod] = useState(PAYMENT_METHOD.WALLET);
  const [stage, setStage] = useState("form"); // form | gateway (đang chờ VNPay xác nhận)
  const [payUrl, setPayUrl] = useState(null);
  const [pollUntil, setPollUntil] = useState(0);
  const returning = useRef(false); // vừa mở VNPay → lần quay lại app đầu tiên báo nếu chưa trả xong
  const deadlineMs = r?.shipBackFeeDeadline
    ? toDate(r.shipBackFeeDeadline).valueOf()
    : 0;
  const left = useSecondsLeft(deadlineMs);
  // Hết giờ thật (left = 0 ở khung hình đầu khi vừa tải xong không tính)
  const feeExpired = !!deadlineMs && left === 0 && Date.now() >= deadlineMs;
  const pay = useReturnMutation((m) =>
    returnsApi.payShipBack({ ret: r, method: m }),
  );

  const paid =
    !!r?.shipBackStatus && r.shipBackStatus !== SB.AWAITING_PAYMENT;

  // Đã mở VNPay → nhờ BE hỏi lại cổng trước (IPN có thể chưa về), rồi đọc lại yêu cầu. Lỗi hỏi cổng thì bỏ qua
  const checkPaid = async () => {
    await returnsApi.syncShipBackPayment(id).catch(() => null);
    return query.refetch();
  };

  // Trả xong (Ví ngay / VNPay qua IPN) → về chi tiết yêu cầu
  useEffect(() => {
    if (!paid) return;
    showToast("Đã trả phí gửi lại, ReHome sẽ gửi hàng cho bạn");
    router.replace(`/returns/${id}`);
  }, [paid]);

  // Đang chờ VNPay: hỏi BE mỗi 3 giây trong 2 phút
  useEffect(() => {
    if (stage !== "gateway") return;
    const t = setInterval(() => {
      if (Date.now() < pollUntil) checkPaid();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [stage, pollUntil]);

  // Quay lại app từ VNPay → hỏi ngay; chưa trả xong thì báo 1 lần
  useEffect(() => {
    if (stage !== "gateway") return;
    const sub = AppState.addEventListener("change", async (s) => {
      if (s !== "active") return;
      setPollUntil(Date.now() + POLL_WINDOW_MS);
      const from = returning.current;
      returning.current = false;
      const res = await checkPaid();
      if (from && res.data?.shipBackStatus === SB.AWAITING_PAYMENT)
        showToast(
          `Chưa nhận được xác nhận thanh toán từ ${PAYMENT_METHOD_LABEL[method]}`,
        );
    });
    return () => sub.remove();
  }, [stage, method]);

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(`/returns/${id}`);
  const header = (
    <AppHeader
      title="Trả phí gửi lại"
      onBack={stage === "gateway" ? () => setStage("form") : goBack}
    />
  );

  if (query.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }
  if (paid) return null; // effect bên trên đang chuyển màn

  // Không còn chờ trả phí: quá hạn (BE đã bỏ lựa chọn) → chọn lại; trạng thái khác → về chi tiết
  if (
    r.status !== R.INVALID ||
    r.shipBackStatus !== SB.AWAITING_PAYMENT ||
    feeExpired
  ) {
    if (r.status !== R.INVALID) return <Redirect href={`/returns/${id}`} />;
    return (
      <Screen header={header}>
        <EmptyState
          icon="time-outline"
          title="Đã quá hạn trả phí gửi lại"
          description="Bạn có thể chọn lại cách nhận hàng: đến địa điểm lấy miễn phí, hoặc chọn gửi lại và trả phí lần nữa."
        >
          <Button
            title="Chọn lại cách nhận hàng"
            onPress={() => router.replace(`/returns/${id}/pickup-choice`)}
          />
        </EmptyState>
      </Screen>
    );
  }

  const fee = Number(r.shipBackFee);
  const first = r.items?.[0];

  const openGateway = async (url) => {
    setPayUrl(url);
    setStage("gateway");
    setPollUntil(Date.now() + POLL_WINDOW_MS);
    if (url) {
      returning.current = true;
      await Linking.openURL(url);
    }
  };

  const onError = (e) => {
    if (e.code === ERROR_CODES.INSUFFICIENT_BALANCE) {
      setMethod(PAYMENT_METHOD.VNPAY); // số dư vừa đổi → trả qua VNPay
      return showToast(e.message);
    }
    showToast(e.message);
    query.refetch(); // quá hạn / đã trả → màn tự đổi theo trạng thái mới
  };

  const submit = () =>
    Alert.alert(
      `Trả ${formatVnd(fee)} bằng ${PAYMENT_METHOD_LABEL[method]}?`,
      "Phí gửi lại không hoàn nếu giao không thành công.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Trả phí",
          onPress: () =>
            pay.mutate(method, {
              onSuccess: (res) => {
                if (res.paid) return; // Ví: effect chuyển màn sau khi tải lại
                openGateway(res.payUrl);
              },
              onError,
            }),
        },
      ],
    );

  const summary = (
    <View style={styles.box}>
      {first ? <OrderItemRow item={first} /> : null}
      <View style={styles.divider} />
      <Text style={styles.caption}>GỬI TỚI</Text>
      <Text style={styles.strong}>
        {r.shipBackRecipientName} · {formatPhone(r.shipBackPhone)}
      </Text>
      <Text style={styles.muted}>{r.shipBackAddressDetail}</Text>
      <View style={styles.feeRow}>
        <Text style={styles.muted}>Phí GHN gửi lại</Text>
        <Text style={styles.total}>{formatVnd(fee)}</Text>
      </View>
    </View>
  );

  // ----- Đang chờ VNPay xác nhận -----
  if (stage === "gateway") {
    return (
      <Screen
        scroll
        header={header}
        footer={
          <View style={styles.footerCol}>
            {payUrl ? (
              <Button
                title="Mở lại trang thanh toán"
                onPress={() => openGateway(payUrl)}
              />
            ) : null}
            <Button
              title="Kiểm tra lại"
              variant="secondary"
              loading={query.isFetching}
              onPress={async () => {
                setPollUntil(Date.now() + POLL_WINDOW_MS);
                const res = await checkPaid();
                if (res.data?.shipBackStatus === SB.AWAITING_PAYMENT)
                  showToast(
                    `Chưa nhận được xác nhận thanh toán từ ${PAYMENT_METHOD_LABEL[method]}`,
                  );
              }}
            />
          </View>
        }
        contentStyle={styles.content}
      >
        {summary}
        <View style={[styles.box, styles.boxStrong, styles.center]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.boxTitle}>
            Đang chờ {PAYMENT_METHOD_LABEL[method]} xác nhận
          </Text>
          <Text style={[styles.muted, styles.centerText]}>
            Trả xong trên trang {PAYMENT_METHOD_LABEL[method]} rồi quay lại
            ReHome — app tự cập nhật. Chưa trả được thì đổi cách trả.
          </Text>
        </View>
        <Button
          title="Đổi cách trả"
          variant="text"
          onPress={() => setStage("form")}
        />
      </Screen>
    );
  }

  // ----- Chọn cách trả -----
  return (
    <Screen
      scroll
      header={header}
      footer={
        <Button
          title={`Trả ${formatVnd(fee)} bằng ${PAYMENT_METHOD_LABEL[method]}`}
          loading={pay.isPending}
          onPress={submit}
        />
      }
      contentStyle={styles.content}
    >
      <PaymentCountdown
        seconds={left}
        totalSeconds={SHIP_BACK_LIMITS.FEE_DEADLINE_MINUTES * 60}
      />
      <Text style={styles.muted}>
        Trả trước {toDate(r.shipBackFeeDeadline).format("HH:mm DD/MM")}. Quá hạn
        thì lựa chọn gửi lại bị huỷ, bạn chọn lại cách nhận hàng.
      </Text>
      {summary}
      <View style={styles.gapSm}>
        <Text style={styles.sectionTitle}>CÁCH TRẢ PHÍ</Text>
        <PaymentMethodPicker value={method} onChange={setMethod} amount={fee} />
      </View>
      <View style={styles.note}>
        <Text style={styles.text}>
          Trả xong, ReHome đóng gói và gửi trong{" "}
          <Text style={styles.strong}>
            {SHIP_BACK_LIMITS.SHIP_WITHIN_DAYS} ngày
          </Text>
          , bạn theo dõi bằng mã vận đơn GHN. Giao không thành công thì{" "}
          <Text style={styles.strong}>không hoàn phí</Text>, hàng về{" "}
          {r.warehouseName ?? "địa điểm ký gửi"} để bạn đến lấy.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  footerCol: { gap: spacing.sm },
  center: { alignItems: "center" },
  centerText: { textAlign: "center" },
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  boxTitle: { ...textStyles.heading, color: colors.text },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
    backgroundColor: colors.neutral,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  total: { ...textStyles.heading, color: colors.text },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  note: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
});
