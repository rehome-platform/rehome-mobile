import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as ExpoLinking from "expo-linking";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import { ERROR_CODES } from "@/constants/errorCodes";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@/constants/order";
import {
  BILLING_CYCLE,
  BILLING_CYCLE_LABEL,
  MEMBERSHIP_LIMITS,
  SUBSCRIPTION_STATUS,
  TIER_SHORT,
} from "@/constants/membership";
import { PaymentMethodPicker } from "@/features/orders/components/PaymentMethodPicker";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import * as membershipApi from "../api/membershipApi";
import { membershipKeys } from "../api/queryKeys";
import { useMyMembership, usePlans } from "../hooks/useMembership";
import {
  expectedExpiry,
  hasPaidPlan,
  priceOf,
} from "../utils/membershipRules";
import { TierBadge } from "../components/TierBadge";

const fmt = (d) => dayjs(d).format("DD/MM/YYYY");
const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/membership");

// Câu dễ hiểu cho lỗi BE hay gặp; còn lại hiện message BE
const FRIENDLY_ERROR = {
  [ERROR_CODES.MEMBERSHIP_PAYMENT_PENDING]:
    "Bạn đang có một giao dịch mua gói chờ thanh toán. Hoàn tất giao dịch đó, hoặc chờ khoảng 15 phút cho giao dịch hết hạn rồi thử lại.",
  [ERROR_CODES.MEMBERSHIP_PLAN_NOT_PURCHASABLE]:
    "Gói này vừa ngừng bán. Quay lại chọn gói khác.",
  [ERROR_CODES.MEMBERSHIP_PLAN_YEARLY_NOT_AVAILABLE]:
    "Gói này không bán theo năm. Quay lại chọn mua theo tháng.",
};

// M-02 · Xác nhận mua gói (/membership/subscribe?planId=&cycle=)
// Trạng thái màn: FORM → PROCESSING → SUCCESS | FAILED; MoMo/VNPay: FORM → WAITING (mở cổng, quay về app tự kiểm tra)
export default function SubscribeScreen() {
  const { planId, cycle: cycleParam } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const cycle =
    cycleParam === BILLING_CYCLE.YEARLY ? BILLING_CYCLE.YEARLY : BILLING_CYCLE.MONTHLY;
  const plans = usePlans();
  const mine = useMyMembership();

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Xác nhận mua gói" onBack={goBack} />;
  if (plans.isPending || mine.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  const error = plans.error ?? mine.error;
  if (error) {
    return (
      <Screen header={header}>
        <ErrorBox message={error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => {
              plans.refetch();
              mine.refetch();
            }}
          />
        </ErrorBox>
      </Screen>
    );
  }
  const plan = plans.data?.find((p) => p.id === planId);
  const price = plan ? priceOf(plan, cycle) : null;
  if (!plan || price == null) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="ribbon-outline"
          title="Gói này hiện không bán"
          description="Gói vừa ngừng bán hoặc không bán theo năm. Quay lại chọn gói khác."
        >
          <Button title="Quay lại" variant="secondary" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }
  return <SubscribeBody plan={plan} cycle={cycle} price={price} me={mine.data} />;
}

function SubscribeBody({ plan, cycle, price, me }) {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const [method, setMethod] = useState(PAYMENT_METHOD.WALLET); // không đủ số dư → PaymentMethodPicker tự đổi sang MoMo
  const [phase, setPhase] = useState("FORM");
  const [result, setResult] = useState(null); // response subscribe (thành công / chờ cổng)
  const [failure, setFailure] = useState(null); // ApiError
  const [pollUntil, setPollUntil] = useState(0);
  // Hạn gói trước khi mua — gia hạn qua cổng thì BE cộng dồn vào gói cũ (subscriptionId không đổi) → so hạn mới
  const [prevExpires] = useState(me?.expiresAt ?? null);

  const renew = hasPaidPlan(me) && me.tier === plan.tier;
  const switching = hasPaidPlan(me) && me.tier !== plan.tier;
  const expiry = expectedExpiry(plan, cycle, me);

  // MoMo/VNPay: hỏi lại gói của tôi tới khi kích hoạt (không tin kết quả trang cổng hiện)
  const watch = useMyMembership({
    refetchInterval: () =>
      phase === "WAITING" && Date.now() < pollUntil
        ? MEMBERSHIP_LIMITS.POLL_MS
        : false,
  });
  // Đã kích hoạt: gói mới (đổi hạng / mua lần đầu) có đúng subscriptionId vừa tạo,
  // hoặc gia hạn cùng hạng → hạn của gói đang dùng được cộng thêm
  const isActivated = (d) =>
    d?.status === SUBSCRIPTION_STATUS.ACTIVE &&
    (d.subscriptionId === result?.subscriptionId ||
      (!!prevExpires && dayjs(d.expiresAt).isAfter(prevExpires)));
  const activated = phase === "WAITING" && isActivated(watch.data);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: membershipKeys.all });
    queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["tryon-live"] }); // lượt thử đồ real-time đổi theo gói
  };

  useEffect(() => {
    if (!activated) return;
    setResult((r) => ({
      ...r,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      tierName: watch.data.tierName,
      expiresAt: watch.data.expiresAt,
    }));
    setPhase("SUCCESS");
    refreshAll();
  }, [activated]);

  // Quay lại app từ MoMo/VNPay → hỏi BE ngay + hỏi tiếp 60 giây
  useEffect(() => {
    if (phase !== "WAITING") return;
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        watch.refetch();
        setPollUntil(Date.now() + MEMBERSHIP_LIMITS.POLL_WINDOW_MS);
      }
    });
    return () => sub.remove();
  }, [phase]);

  // Đang trừ tiền → chặn nút Back (tránh người dùng tưởng đã huỷ)
  useEffect(() => {
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => phase === "PROCESSING",
    );
    return () => sub.remove();
  }, [phase]);

  const pay = async () => {
    setPhase("PROCESSING");
    try {
      const res = await membershipApi.subscribe({
        planId: plan.id,
        billingCycle: cycle,
        paymentMethod: method,
        // Cổng trả về đúng màn "Gói của tôi" trong app (BE bắt buộc khi trả MoMo/VNPay)
        redirectUrl:
          method === PAYMENT_METHOD.WALLET
            ? undefined
            : ExpoLinking.createURL("membership/me"),
      });
      setResult(res);
      if (res.status === SUBSCRIPTION_STATUS.ACTIVE) {
        setPhase("SUCCESS");
        refreshAll();
        return;
      }
      setPhase("WAITING");
      setPollUntil(Date.now() + MEMBERSHIP_LIMITS.POLL_WINDOW_MS);
      // Như màn thanh toán đơn: mở trình duyệt ngoài, quay lại app thì tự kiểm tra
      if (res.payUrl) await Linking.openURL(res.payUrl);
    } catch (e) {
      if (e.code === ERROR_CODES.INSUFFICIENT_BALANCE) {
        // Số dư vừa đổi (vd đang khoá cho yêu cầu rút) → chuyển MoMo, ở lại màn
        setMethod(PAYMENT_METHOD.MOMO);
        setPhase("FORM");
        wallet.refetch();
        return showToast("Ví ReHome không đủ số dư, chọn MoMo hoặc VNPay");
      }
      setFailure(e);
      setPhase("FAILED");
    }
  };

  const check = async () => {
    const res = await watch.refetch();
    setPollUntil(Date.now() + MEMBERSHIP_LIMITS.POLL_WINDOW_MS);
    if (!isActivated(res.data))
      showToast(
        `Chưa nhận được xác nhận thanh toán từ ${PAYMENT_METHOD_LABEL[method]}`,
      );
  };

  // ----- Đang xử lý -----
  if (phase === "PROCESSING") {
    return (
      <Screen header={<AppHeader title="Xác nhận mua gói" />}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.resultTitle}>Đang xử lý thanh toán…</Text>
          <Text style={styles.resultDesc}>
            {method === PAYMENT_METHOD.WALLET
              ? `Đang trừ ${formatVnd(price)} từ Ví ReHome và kích hoạt ${plan.name}. Vui lòng không tắt ứng dụng.`
              : `Đang mở trang ${PAYMENT_METHOD_LABEL[method]}…`}
          </Text>
        </View>
      </Screen>
    );
  }

  // ----- Thành công -----
  if (phase === "SUCCESS") {
    return (
      <Screen
        header={<AppHeader title="Xác nhận mua gói" />}
        contentStyle={styles.resultWrap}
        footer={
          <View style={styles.footerCol}>
            <Button
              title="Xem gói của tôi"
              onPress={() => router.replace("/membership/me")}
            />
            <Button
              title="Về trang chủ"
              variant="secondary"
              onPress={() => router.dismissTo("/")}
            />
          </View>
        }
      >
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.resultTitle}>
            Kích hoạt {result?.tierName ?? plan.name} thành công
          </Text>
          <Text style={styles.resultDesc}>
            Hạn mức thử đồ{plan.benefits?.featuredListing ? ", quyền hiển thị nổi bật" : ""} và
            voucher đã được cập nhật ngay.
          </Text>
        </View>
        <View style={styles.summary}>
          <Row label="Gói" value={`${result?.tierName ?? plan.name} · ${BILLING_CYCLE_LABEL[cycle]}`} />
          {result?.expiresAt ? (
            <Row label="Hết hạn" value={fmt(result.expiresAt)} />
          ) : null}
          {result?.vouchersIssued > 0 ? (
            <Row label="Voucher nhận được" value={`${result.vouchersIssued} mã`} />
          ) : null}
          {method === PAYMENT_METHOD.WALLET && wallet.data ? (
            <Row
              label="Số dư ví còn lại"
              value={formatVnd(wallet.data.availableBalance)}
            />
          ) : null}
          {result?.replacedTier ? (
            <Row
              label="Gói trước đó"
              value={`${TIER_SHORT[result.replacedTier] ?? result.replacedTier} · đã dừng`}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  // ----- Thất bại -----
  if (phase === "FAILED") {
    return (
      <Screen
        header={<AppHeader title="Xác nhận mua gói" onBack={goBack} />}
        contentStyle={styles.resultWrap}
        footer={
          <View style={styles.footerCol}>
            <Button title="Thử lại" onPress={() => setPhase("FORM")} />
            <Button
              title="Quay lại chọn gói"
              variant="secondary"
              onPress={goBack}
            />
          </View>
        }
      >
        <View style={styles.center}>
          <Ionicons name="close-circle" size={64} color={colors.error} />
          <Text style={styles.resultTitle}>Chưa mua được gói</Text>
          <Text style={styles.resultDesc}>
            {FRIENDLY_ERROR[failure?.code] ?? failure?.message}
          </Text>
          {method === PAYMENT_METHOD.WALLET ? (
            <Text style={styles.resultDesc}>Ví ReHome chưa bị trừ tiền.</Text>
          ) : null}
          {failure?.code ? (
            <Text style={styles.code}>
              Mã lỗi: {failure.code}
              {failure.status ? ` · ${failure.status}` : ""}
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  // ----- Chờ MoMo / VNPay -----
  if (phase === "WAITING") {
    const label = PAYMENT_METHOD_LABEL[method];
    return (
      <Screen
        header={<AppHeader title="Chờ thanh toán" onBack={goBack} />}
        contentStyle={styles.resultWrap}
        footer={
          <View style={styles.footerCol}>
            <Button
              title={`Tôi đã thanh toán — kiểm tra lại`}
              loading={watch.isFetching}
              onPress={check}
            />
            {result?.payUrl ? (
              <Button
                title={`Mở lại trang ${label}`}
                variant="secondary"
                onPress={() => Linking.openURL(result.payUrl)}
              />
            ) : null}
          </View>
        }
      >
        <View style={styles.center}>
          <Ionicons name="time-outline" size={56} color={colors.primary} />
          <Text style={styles.resultTitle}>Đang chờ xác nhận từ {label}</Text>
          <Text style={styles.resultDesc}>
            Trả {formatVnd(price)} trên trang {label} rồi quay lại ReHome — app
            tự kiểm tra và kích hoạt gói. Link thanh toán dùng được khoảng 15
            phút.
          </Text>
        </View>
      </Screen>
    );
  }

  // ----- Form xác nhận -----
  return (
    <Screen
      scroll
      header={<AppHeader title="Xác nhận mua gói" onBack={goBack} />}
      contentStyle={styles.content}
      footer={
        <View style={styles.footerCol}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.total}>{formatVnd(price)}</Text>
          </View>
          <Button
            title={
              method === PAYMENT_METHOD.WALLET
                ? `Trả bằng Ví ReHome · ${formatVnd(price)}`
                : `Thanh toán qua ${PAYMENT_METHOD_LABEL[method]}`
            }
            onPress={pay}
          />
        </View>
      }
    >
      <View style={styles.summary}>
        <View style={styles.summaryHead}>
          <View style={styles.flex}>
            <TierBadge tier={plan.tier} />
            <Text style={styles.planName}>{plan.name}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.price}>{formatVnd(price)}</Text>
            <Text style={styles.caption}>{BILLING_CYCLE_LABEL[cycle]}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        {renew ? (
          <>
            <Row label="Hạn hiện tại" value={fmt(me.expiresAt)} />
            <Row label="Hạn mới (cộng dồn)" value={fmt(expiry)} strong />
          </>
        ) : (
          <>
            <Row label="Bắt đầu" value={`${fmt(dayjs())} (hôm nay)`} />
            <Row label="Hết hạn dự kiến" value={fmt(expiry)} />
          </>
        )}
      </View>

      {switching ? (
        <View style={styles.warn}>
          <Ionicons name="alert-circle" size={20} color={tones.warning.fg} />
          <Text style={styles.warnText}>
            Gói {me.tierName} của bạn (còn {me.daysRemaining} ngày
            {me.remainingValue != null
              ? `, khoảng ${formatVnd(me.remainingValue)}`
              : ""}
            ) sẽ <Text style={styles.bold}>dừng ngay</Text> khi gói mới có hiệu
            lực và <Text style={styles.bold}>không được hoàn</Text> phần còn lại.
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>PHƯƠNG THỨC THANH TOÁN</Text>
      <PaymentMethodPicker value={method} onChange={setMethod} amount={price} />

      <NoteBox>
        {method === PAYMENT_METHOD.WALLET
          ? "Tiền được trừ ngay trong Ví ReHome, gói có hiệu lực ngay sau khi thanh toán. Gói không tự gia hạn — ReHome nhắc bạn trước khi hết hạn."
          : `Mở trang ${PAYMENT_METHOD_LABEL[method]} để trả, xong quay lại ReHome — app tự kiểm tra và kích hoạt gói. Gói không tự gia hạn.`}
      </NoteBox>
    </Screen>
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1, gap: spacing.xs },
  right: { alignItems: "flex-end" },
  summary: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  summaryHead: { flexDirection: "row", gap: spacing.md },
  planName: { ...textStyles.heading, color: colors.text },
  price: { ...textStyles.title, fontFamily: fonts.bold, color: colors.primary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.neutral },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { ...textStyles.body, color: colors.textSecondary },
  rowValue: { ...textStyles.body, color: colors.text, textAlign: "right" },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  warn: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: tones.warning.bg,
  },
  warnText: { flex: 1, ...textStyles.body, color: colors.text },
  section: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  footerCol: { gap: spacing.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  totalLabel: { ...textStyles.body, color: colors.textSecondary },
  total: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  resultWrap: { gap: spacing.xl, justifyContent: "center" },
  center: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  resultTitle: { ...textStyles.title, color: colors.text, textAlign: "center" },
  resultDesc: { ...textStyles.body, color: colors.textSecondary, textAlign: "center" },
  code: { ...textStyles.caption, color: colors.textSecondary },
});
