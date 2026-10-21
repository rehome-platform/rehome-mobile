import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { withdrawalApi } from "../api/withdrawalApi";
import { useWithdrawalMutation } from "../hooks/useWithdrawals";
import {
  canWithdraw,
  estimateFee,
  freeWindowOf,
  nextFreeWindow,
  splitFee,
} from "../utils/withdrawalRules";

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
        <Text style={styles.caption}>
          {product.id} · {product.warehouseName}
        </Text>
      </View>
      {fee ? <Text style={styles.strong}>{formatVnd(fee)}</Text> : null}
    </View>
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.strong : styles.muted}>{label}</Text>
      <Text style={styles.strong}>{value}</Text>
    </View>
  );
}

// KG-13 / KG-14 · Rút lại hàng ký gửi (/withdrawals/new?productId=)
export default function WithdrawalNewScreen() {
  const { productId } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useQuery({
    queryKey: consignKeys.product(productId),
    queryFn: () => consignmentApi.getProduct(productId),
    enabled: isAuthed && !!productId,
  });
  const wallet = useWallet();
  const [request, setRequest] = useState(null); // yêu cầu đã tạo (chưa trả phí xong)
  const [stage, setStage] = useState("form"); // form | momo | momoFailed
  const [momo, setMomo] = useState(null); // { fromWallet, fromMomo } BE trả khi ví thiếu
  const [formError, setFormError] = useState(null);

  const done = (id) => {
    showToast("Đã gửi yêu cầu rút hàng");
    router.replace(`/withdrawals/${id}`);
  };

  // Tạo yêu cầu (dùng lại nếu đã tạo) → miễn phí thì xong; có phí → trả (ví trước, thiếu MoMo)
  const submit = useWithdrawalMutation(async () => {
    const w = request ?? (await withdrawalApi.createWithdrawal(productId));
    setRequest(w);
    if (w.status) return { done: w.id };
    const pay = await withdrawalApi.payWithdrawalFee(w.id);
    if (pay.paid) return { done: w.id };
    return { momo: { fromWallet: pay.fromWallet, fromMomo: pay.fromMomo } };
  });
  const momoPay = useWithdrawalMutation((success) =>
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
      onBack={goBack}
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

  const product = query.data;
  if (getProductView(product) === PRODUCT_VIEW.WITHDRAWING)
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
  const available = wallet.data?.availableBalance ?? 0;
  const split = splitFee(fee, available);
  const next = fee > 0 ? nextFreeWindow(product) : null;

  const onSubmit = () =>
    Alert.alert(
      "Gửi yêu cầu rút hàng?",
      fee > 0
        ? `Phí ${formatVnd(fee)} không hoàn lại. Sản phẩm gỡ khỏi sàn ngay sau khi trả phí.`
        : "Sản phẩm gỡ khỏi sàn ngay, bạn có 7 ngày để đến kho lấy.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Gửi",
          onPress: () => {
            setFormError(null);
            submit.mutate(undefined, {
              onSuccess: (res) => {
                if (res.done) return done(res.done);
                setMomo(res.momo);
                setStage("momo");
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

  // [MOCK] Bản thật mở payUrl bằng expo-web-browser (nhánh feature/payment-momo)
  const payMomo = () => {
    if (!__DEV__ || !MOCK.withdrawals) {
      showToast("Thanh toán MoMo sắp có");
      return;
    }
    Alert.alert(
      "Mock MoMo",
      `Giả lập kết quả thanh toán ${formatVnd(momo.fromMomo)}`,
      [
        {
          text: "Thất bại",
          style: "destructive",
          onPress: () =>
            momoPay.mutate(false, { onSuccess: () => setStage("momoFailed") }),
        },
        {
          text: "Thành công",
          onPress: () =>
            momoPay.mutate(true, {
              onSuccess: (r) =>
                r.paid ? done(request.id) : setStage("momoFailed"),
            }),
        },
      ],
    );
  };

  // ----- KG-14: thanh toán phần còn lại qua MoMo / thất bại -----
  if (stage !== "form") {
    const failed = stage === "momoFailed";
    const footer = failed ? (
      <View style={styles.footerRow}>
        <Button
          title="Quay lại"
          variant="secondary"
          onPress={goBack}
          style={styles.flex}
        />
        <Button
          title="Thử lại"
          onPress={() => setStage("momo")}
          style={styles.flex}
        />
      </View>
    ) : (
      <Button
        title={`Thanh toán ${formatVnd(momo.fromMomo)} qua MoMo`}
        loading={momoPay.isPending}
        onPress={payMomo}
      />
    );
    return (
      <Screen
        scroll
        header={header}
        footer={footer}
        contentStyle={styles.content}
      >
        <ProductRow product={product} fee={fee} />
        {failed ? (
          <View style={[styles.box, styles.boxStrong, styles.center]}>
            <Text style={styles.boxTitle}>Thanh toán MoMo thất bại</Text>
            <Text style={styles.muted}>
              Giao dịch {formatVnd(momo.fromMomo)} không hoàn tất. Ví của bạn
              chưa bị trừ tiền.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.box, styles.boxStrong]}>
              <Text style={styles.boxTitle}>Ví không đủ số dư</Text>
              <Row label="Phí rút hàng" value={formatVnd(fee)} />
              {momo.fromWallet > 0 ? (
                <Row label="Trừ ví" value={formatVnd(momo.fromWallet)} />
              ) : null}

              <View style={styles.divider} />
              <Row
                strong
                label="Còn lại qua MoMo"
                value={formatVnd(momo.fromMomo)}
              />
            </View>
            <View style={styles.dashed}>
              <Text style={styles.text}>
                Phí được trừ ví trước, phần còn thiếu trả qua MoMo.{" "}
                <Text style={styles.strong}>
                  Ví chỉ bị trừ khi MoMo thanh toán thành công.
                </Text>
              </Text>
            </View>
          </>
        )}
      </Screen>
    );
  }

  // ----- KG-13: miễn phí / có phí -----
  const footer = (
    <Button
      title={
        fee > 0
          ? `Trả ${formatVnd(fee)} và gửi yêu cầu`
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
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>
          {fee > 0 ? `Rút hàng mất phí ${formatVnd(fee)}` : "Rút hàng miễn phí"}
        </Text>
        <Text style={styles.muted}>
          {win.isFree
            ? `Bạn đang ở ngày ${win.dayOfTerm} của cửa sổ ${win.windowDays} ngày đầu kỳ ${product.currentTerm} — còn ${win.daysLeft} ngày rút không mất phí.`
            : `Bạn đang ở ngày ${win.dayOfTerm} của kỳ ${product.currentTerm} — đã qua cửa sổ ${win.windowDays} ngày rút miễn phí.`}
        </Text>
      </View>

      <ProductRow product={product} />

      {fee > 0 ? (
        <View style={styles.box}>
          <Text style={styles.sectionTitle}>CÁCH TRẢ PHÍ</Text>
          {wallet.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Row label="Trừ từ ví" value={formatVnd(split.fromWallet)} />
              {split.fromMomo > 0 ? (
                <Row
                  label="Thanh toán MoMo"
                  value={formatVnd(split.fromMomo)}
                />
              ) : null}
              <Text style={styles.caption}>
                Số dư khả dụng {formatVnd(available)}
                {split.fromMomo > 0
                  ? " — không đủ, phần còn thiếu trả qua MoMo"
                  : " — đủ"}
              </Text>
            </>
          )}
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
            ? `Nếu quá 7 ngày bạn không đến kho nhận hàng, yêu cầu bị huỷ, sản phẩm đăng bán lại và phí ${formatVnd(fee)} không được hoàn.`
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
  boxStrong: { borderWidth: 2, borderColor: colors.text },
  boxTitle: { ...textStyles.heading, color: colors.text },
  soft: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  dashed: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
    backgroundColor: colors.neutral,
  },
  step: { flexDirection: "row", gap: spacing.md },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNoText: {
    ...textStyles.caption,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
});
