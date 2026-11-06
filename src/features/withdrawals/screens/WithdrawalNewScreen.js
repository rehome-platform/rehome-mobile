import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { formatRate, getProductView } from "@/utils/consignment";
import { PRODUCT_VIEW } from "@/constants/consignment";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@/constants/order";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { PaymentMethodPicker } from "@/features/orders/components/PaymentMethodPicker";
import { withdrawalApi } from "../api/withdrawalApi";
import { withdrawalKeys } from "../api/queryKeys";
import { useWithdrawalMutation } from "../hooks/useWithdrawals";
import {
  canWithdraw,
  estimateFee,
  freeWindowOf,
  nextFreeWindow,
} from "../utils/withdrawalRules";

const POLL_MS = 3000;
const POLL_WINDOW_MS = 2 * 60 * 1000; // hỏi liên tục 2 phút sau mỗi lần mở trang thanh toán / quay lại app

const STEPS = (warehouse) => [
  ["Sản phẩm gỡ khỏi sàn ngay", "Không ai mua được nữa"],
  [`Đến ${warehouse} trong 7 ngày`, "Mang theo điện thoại để mở mã Member"],
  ["Đọc mã Member tại quầy", "Moderator đối chiếu rồi bàn giao hàng"],
  ["Biên nhận ký gửi kết thúc", null],
];

function ProductRow({ product, fee }) {
  return (
    <View style={styles.productRow}>
      {product.photoUrl ? (
        <Image source={{ uri: product.photoUrl }} style={styles.thumb} />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.flex}>
        <Text style={styles.strong}>{product.name}</Text>
        <Text style={styles.caption}>
          {[
            product.brandName,
            product.size && `Size ${product.size}`,
            formatVnd(product.currentPrice),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={styles.caption}>{product.warehouseName}</Text>
      </View>
      {fee ? <Text style={styles.strong}>{formatVnd(fee)}</Text> : null}
    </View>
  );
}

// Sản phẩm + điều khoản rút hàng (cửa sổ miễn phí, phí rút). /products/mine đã trả sẵn 2 số này theo biên nhận
// đang áp dụng → dùng luôn; chỉ dữ liệu cũ thiếu mới đọc biên nhận (receiptId)
async function loadProduct(productId) {
  const p = await consignmentApi.getProduct(productId);
  if (p.freeWithdrawalWindowDays != null && p.withdrawalFee != null)
    return { ...p, withdrawalFee: Number(p.withdrawalFee) };
  if (!p.receiptId) return p;
  const r = await consignmentApi.getReceipt(p.receiptId).catch(() => null);
  return r
    ? {
        ...p,
        freeWithdrawalWindowDays:
          p.freeWithdrawalWindowDays ?? r.freeWithdrawalWindowDays,
        withdrawalFee: p.withdrawalFee ?? Number(r.withdrawalFee ?? 0),
      }
    : p;
}

// KG-13 / KG-14 · Rút lại hàng ký gửi (/withdrawals/new?productId=). Phí (nếu có) trả bằng ĐÚNG 1 cách:
// Ví ReHome (trừ ngay) · MoMo / VNPay (mở trang thanh toán, quay lại app thì hỏi BE feePaid)
export default function WithdrawalNewScreen() {
  const { productId } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useQuery({
    queryKey: [...consignKeys.product(productId), "withdrawal-terms"],
    queryFn: () => loadProduct(productId),
    enabled: isAuthed && !!productId,
  });
  const product = query.data;
  const view = product ? getProductView(product) : null;

  // BE gỡ món khỏi sàn NGAY khi tạo yêu cầu, phí trả sau → yêu cầu đã có mà chưa trả phí thì trả tiếp ở đây
  const existing = useQuery({
    queryKey: withdrawalKeys.detail(product?.activeWithdrawalId),
    queryFn: () => withdrawalApi.getWithdrawal(product.activeWithdrawalId),
    enabled: view === PRODUCT_VIEW.WITHDRAWING,
  });

  const [request, setRequest] = useState(null); // yêu cầu đã tạo, chưa trả phí xong
  const [method, setMethod] = useState(PAYMENT_METHOD.WALLET);
  const [stage, setStage] = useState("form"); // form | gateway (đang chờ MoMo / VNPay xác nhận)
  const [payUrl, setPayUrl] = useState(null);
  const [pollUntil, setPollUntil] = useState(0);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (existing.data && !existing.data.feePaid && !request)
      setRequest(existing.data);
  }, [existing.data]);

  const done = (id) => {
    showToast("Đã gửi yêu cầu rút hàng");
    router.replace(`/withdrawals/${id}`);
  };

  // Đang chờ MoMo / VNPay: hỏi BE feePaid (IPN về là có); quay lại app thì hỏi tiếp 2 phút
  const paid = useQuery({
    queryKey: [...withdrawalKeys.detail(request?.id), "fee"],
    queryFn: () => withdrawalApi.getWithdrawal(request.id),
    enabled: stage === "gateway" && !!request,
    refetchInterval: () => (Date.now() < pollUntil ? POLL_MS : false),
  });
  useEffect(() => {
    if (paid.data?.feePaid) done(paid.data.id);
  }, [paid.data?.feePaid]);
  useEffect(() => {
    if (stage !== "gateway") return;
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        setPollUntil(Date.now() + POLL_WINDOW_MS);
        paid.refetch();
      }
    });
    return () => sub.remove();
  }, [stage]);

  // Tạo yêu cầu (dùng lại nếu đã có) → miễn phí thì xong; có phí → trả bằng cách đã chọn
  const submit = useWithdrawalMutation(async () => {
    const w = request ?? (await withdrawalApi.createWithdrawal(productId));
    setRequest(w);
    if (!w.feeCharged || w.feePaid) return { done: w.id };
    const pay = await withdrawalApi.payWithdrawalFee(w.id, method);
    if (method === PAYMENT_METHOD.WALLET) return { done: w.id };
    return { gateway: pay.payUrl ?? null, id: w.id };
  });
  const mockPay = useWithdrawalMutation((success) =>
    withdrawalApi.mockMomoResult(request.id, success),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace(`/my-products/${productId}`);
  const header = (
    <AppHeader
      title={stage === "form" ? "Rút lại hàng" : "Trả phí rút hàng"}
      onBack={stage === "gateway" ? () => setStage("form") : goBack}
    />
  );

  if (
    query.isPending ||
    (view === PRODUCT_VIEW.WITHDRAWING && existing.isPending)
  ) {
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

  // Đã có yêu cầu và đã trả phí (hoặc miễn phí) → xem chi tiết
  if (view === PRODUCT_VIEW.WITHDRAWING && existing.data?.feePaid && !request)
    return <Redirect href={`/withdrawals/${product.activeWithdrawalId}`} />;
  if (!canWithdraw(product) && !request) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="cube-outline"
          title="Sản phẩm này không rút được lúc này"
          description="Chỉ rút được khi món đang bán, chưa có đơn và chưa tới cuối kỳ."
        />
      </Screen>
    );
  }

  const win = freeWindowOf(product);
  const fee = request?.feeCharged ?? estimateFee(product);
  const next = fee > 0 && !request ? nextFreeWindow(product) : null;

  const openGateway = async (url) => {
    setPayUrl(url);
    setStage("gateway");
    setPollUntil(Date.now() + POLL_WINDOW_MS);
    if (url) await Linking.openURL(url);
  };

  const onSubmit = () =>
    Alert.alert(
      request ? "Trả phí rút hàng?" : "Gửi yêu cầu rút hàng?",
      fee > 0
        ? `Phí ${formatVnd(fee)} trả bằng ${PAYMENT_METHOD_LABEL[method]}, không hoàn lại. Sản phẩm gỡ khỏi sàn ngay.`
        : "Sản phẩm gỡ khỏi sàn ngay, bạn có 7 ngày để đến địa điểm ký gửi lấy.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: request ? "Trả phí" : "Gửi",
          onPress: () => {
            setFormError(null);
            submit.mutate(undefined, {
              onSuccess: (res) => {
                if (res.done) return done(res.done);
                openGateway(res.gateway);
              },
              onError: (e) => {
                if (e.code === ERROR_CODES.PRODUCT_ALREADY_ORDERED) {
                  Alert.alert(
                    "Không rút được",
                    "Món này vừa có người đặt mua, không rút được nữa.",
                    [{ text: "OK", onPress: goBack }],
                  );
                  return;
                }
                setFormError(e.message);
              },
            });
          },
        },
      ],
    );

  // Bản mock không có trang MoMo / VNPay thật → hộp chọn kết quả
  const mockResult = () =>
    Alert.alert("Mock thanh toán", `Giả lập kết quả trả ${formatVnd(fee)}`, [
      {
        text: "Thất bại",
        style: "destructive",
        onPress: () =>
          mockPay.mutate(false, {
            onSuccess: () => showToast("Thanh toán chưa thành công"),
          }),
      },
      {
        text: "Thành công",
        onPress: () =>
          mockPay.mutate(true, {
            onSuccess: (r) => (r.paid ? done(request.id) : null),
          }),
      },
    ]);

  // ----- KG-14: đang chờ MoMo / VNPay xác nhận -----
  if (stage === "gateway") {
    const isMock = __DEV__ && MOCK.withdrawals && !payUrl;
    return (
      <Screen
        scroll
        header={header}
        footer={
          <View style={styles.footerCol}>
            {isMock ? (
              <Button
                title="Mock: kết quả thanh toán"
                loading={mockPay.isPending}
                onPress={mockResult}
              />
            ) : (
              <Button
                title="Mở lại trang thanh toán"
                onPress={() => openGateway(payUrl)}
              />
            )}
            <Button
              title="Kiểm tra lại"
              variant="secondary"
              loading={paid.isFetching}
              onPress={() => {
                setPollUntil(Date.now() + POLL_WINDOW_MS);
                paid.refetch();
              }}
            />
          </View>
        }
        contentStyle={styles.content}
      >
        <ProductRow product={product} fee={fee} />
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

  // ----- KG-13: miễn phí / có phí -----
  const footer = (
    <Button
      title={
        fee > 0
          ? `Trả ${formatVnd(fee)} ${PAYMENT_METHOD_LABEL[method] ? `bằng ${PAYMENT_METHOD_LABEL[method]}` : ""}`.trim()
          : "Gửi yêu cầu rút hàng"
      }
      loading={submit.isPending}
      onPress={onSubmit}
    />
  );

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      {request ? (
        <View style={[styles.box, styles.boxStrong]}>
          <Text style={styles.strong}>Yêu cầu rút hàng chưa trả phí</Text>
          <Text style={styles.text}>
            Sản phẩm đã gỡ khỏi sàn. Trả phí {formatVnd(fee)} để hoàn tất yêu
            cầu.
          </Text>
        </View>
      ) : (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            {fee > 0
              ? `Rút hàng mất phí ${formatVnd(fee)}`
              : "Rút hàng miễn phí"}
          </Text>
          <Text style={styles.muted}>
            {win.isFree
              ? `Bạn đang ở ngày ${win.dayOfTerm} của cửa sổ ${win.windowDays} ngày đầu kỳ ${product.currentTerm} — còn ${win.daysLeft} ngày rút không mất phí.`
              : `Bạn đang ở ngày ${win.dayOfTerm} của kỳ ${product.currentTerm} — đã qua cửa sổ ${win.windowDays} ngày rút miễn phí.`}
          </Text>
        </View>
      )}

      <ProductRow product={product} />

      {fee > 0 ? (
        <View style={styles.gapSm}>
          <Text style={styles.sectionTitle}>CÁCH TRẢ PHÍ</Text>
          <PaymentMethodPicker
            value={method}
            onChange={setMethod}
            amount={fee}
          />
        </View>
      ) : (
        <View style={styles.gapSm}>
          <Text style={styles.sectionTitle}>SAU KHI GỬI YÊU CẦU</Text>
          {STEPS(product.warehouseName).map(([title, desc], i) => (
            <View key={title} style={styles.step}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>{i + 1}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.strong}>{title}</Text>
                {desc ? <Text style={styles.caption}>{desc}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {next ? (
        <View style={styles.soft}>
          <Text style={styles.strong}>Có thể chờ để khỏi mất phí</Text>
          <Text style={styles.text}>
            Kỳ {next.term} bắt đầu {next.startsAt.format("DD/MM/YYYY")} (còn{" "}
            {next.daysLeft} ngày), bạn sẽ có {win.windowDays} ngày rút miễn phí.
            {next.nextRate != null
              ? ` Nhưng sang kỳ ${next.term} hoa hồng tăng lên ${formatRate(next.nextRate)} nếu món hàng bán được trong lúc chờ.`
              : ""}
          </Text>
        </View>
      ) : null}

      <View style={[styles.box, styles.boxStrong]}>
        <Text style={styles.strong}>
          {fee > 0 ? "Phí không hoàn lại" : "Nếu quá 7 ngày không đến nhận"}
        </Text>
        <Text style={styles.text}>
          {fee > 0
            ? `Nếu quá 7 ngày bạn không đến địa điểm ký gửi nhận hàng, yêu cầu bị huỷ, sản phẩm đăng bán lại và phí ${formatVnd(fee)} không được hoàn.`
            : "Yêu cầu bị huỷ, sản phẩm được đăng bán lại và kỳ ký gửi tiếp tục như cũ."}
        </Text>
      </View>

      {formError ? <ErrorBox message={formError} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  gapSm: { gap: spacing.sm },
  center: { alignItems: "center" },
  centerText: { textAlign: "center" },
  footerCol: { gap: spacing.sm },
  banner: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  bannerTitle: { ...textStyles.heading, color: colors.text },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
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
  soft: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  step: { flexDirection: "row", gap: spacing.md },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNoText: {
    ...textStyles.caption,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
