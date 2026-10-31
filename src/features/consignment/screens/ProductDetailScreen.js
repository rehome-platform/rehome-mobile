import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import {
  ORDER_STEPS,
  PRODUCT_ENDED_LABEL,
  PRODUCT_STATUS,
  PRODUCT_VIEW,
} from "@/constants/consignment";
import { formatVnd } from "@/utils/money";
import {
  commissionRates,
  currentRate,
  daysLeft,
  formatRate,
  getProductView,
  productTiming,
} from "@/utils/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { ProductBadge } from "@/features/consignment/components/ProductBadge";
import { PayoutBreakdown } from "@/features/consignment/components/PayoutBreakdown";
import { TermProgress } from "@/features/consignment/components/TermProgress";
import { PickupInfo } from "@/features/consignment/components/PickupInfo";
import { freeWindowOf } from "@/features/withdrawals/utils/withdrawalRules";
import { MessageWarehouseButton } from "@/features/chat/components/MessageWarehouseButton";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmtDate = (d) => dayjs(d).format("DD/MM/YYYY");
const fmtShort = (d) => dayjs(d).format("DD/MM");

// Đầu màn: ảnh, tên, nhãn, "Thương hiệu · Size", "SKU · Kho"
function ProductHead({ product }) {
  const sub = [product.brandName, product.size ? `Size ${product.size}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <View style={styles.head}>
      {product.photoUrl ? (
        <Image source={{ uri: product.photoUrl }} style={styles.thumb} />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.headInfo}>
        <View style={styles.headTop}>
          <Text style={styles.name}>{product.name}</Text>
          <ProductBadge product={product} />
        </View>
        {sub ? <Text style={styles.muted}>{sub}</Text> : null}
        <Text style={styles.muted}>
          SKU {product.id}
          {product.warehouseName ? ` · ${product.warehouseName}` : ""}
        </Text>
      </View>
    </View>
  );
}
// Phase 5: rút hàng về miễn phí hay mất phí (cửa sổ 7 ngày đầu mỗi kỳ — số lấy từ biên nhận)
function WithdrawWindow({ product }) {
  if (product.freeWithdrawalWindowDays == null) return null;
  const w = freeWindowOf(product);
  return (
    <View style={styles.infoBox}>
      <Text style={styles.boxTitle}>
        {w.isFree
          ? `Rút hàng miễn phí — còn ${w.daysLeft} ngày`
          : `Rút hàng mất phí ${formatVnd(product.withdrawalFee)}`}
      </Text>
      <Text style={styles.body}>
        {w.isFree
          ? `${w.windowDays} ngày đầu mỗi kỳ bạn rút hàng về không mất phí (đến ${w.endsAt.format("DD/MM")}).`
          : `Đã qua ${w.windowDays} ngày rút miễn phí đầu kỳ ${product.currentTerm}.`}
      </Text>
    </View>
  );
}

// ĐANG BÁN (kỳ thường + kỳ cuối)
function SellingBody({ product }) {
  const t = productTiming(product);
  const rate = currentRate(product);
  const nextRate = commissionRates(product)[product.currentTerm]; // kỳ sau (nếu còn)
  return (
    <>
      <TermProgress product={product} />
      <WithdrawWindow product={product} />
      {t.isLastTerm ? null : (
        <NoteBox>
          {`Hết kỳ ${product.currentTerm} mà chưa bán, hệ thống tự gia hạn sang kỳ ${product.currentTerm + 1}` +
            (nextRate != null
              ? ` và hoa hồng tăng lên ${formatRate(nextRate)}.`
              : ".")}
        </NoteBox>
      )}

      <PayoutBreakdown
        title="NẾU BÁN ĐƯỢC HÔM NAY"
        price={product.currentPrice}
        rate={rate}
        rateLabel={`Hoa hồng kỳ ${product.currentTerm}`}
      >
        <Text style={styles.caption}>
          Giá sàn {formatVnd(product.floorPrice)} — bạn không hạ thấp hơn mức
          này được.
          {t.isLastTerm
            ? ` Hoa hồng kỳ ${product.currentTerm} là ${formatRate(rate)} — mức cao nhất, không tăng thêm.`
            : ""}
        </Text>
      </PayoutBreakdown>

      {t.isLastTerm ? (
        <View style={styles.infoBox}>
          <Text style={styles.boxTitle}>Sắp tới sẽ thế nào</Text>
          <Text style={styles.body}>
            Hết {fmtShort(product.endOfTermDeadline)}, sản phẩm gỡ khỏi sàn và
            chuyển sang <Text style={styles.bold}>Chờ xử lý cuối kỳ</Text>. Bạn
            có 30 ngày để chọn nhận lại hàng (miễn phí) hoặc ký gửi lại với giá
            mới. Quá hạn, món hàng thành vô thừa nhận.
          </Text>
        </View>
      ) : null}
    </>
  );
}

// Tiến trình đơn 4 nấc theo OrderStatus (DELIVERED coi như sắp hoàn thành)
function OrderTracker({ status }) {
  const index =
    status === "DELIVERED"
      ? 3
      : ORDER_STEPS.findIndex((s) => s.value === status);
  return (
    <View style={styles.tracker}>
      {ORDER_STEPS.map((step, i) => {
        const done = i < index || status === "COMPLETED";
        const active = i === index && status !== "COMPLETED";
        return (
          <View key={step.value} style={styles.trackStep}>
            <View
              style={[
                styles.trackDot,
                done && styles.trackDone,
                active && styles.trackActive,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
              ) : null}
            </View>
            <Text style={[styles.trackLabel, (done || active) && styles.bold]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ĐÃ CÓ ĐƠN — hoa hồng đã chốt lúc đặt đơn
function OrderBody({ product }) {
  const order = product.order;
  const rate = order?.lockedCommissionRate ?? currentRate(product);
  // BE giữ tiền tới hết hạn trả hàng của người mua (payoutDueAt), cộng ví xong thì có payoutAt
  const paid = !!order?.payoutAt;
  const holding = !paid && !!order?.payoutDueAt;
  return (
    <>
      <View style={styles.attention}>
        <Text style={styles.boxTitle}>
          {paid
            ? "Đã bán — tiền đã vào ví"
            : holding
              ? "Đã bán — chờ hết hạn trả hàng"
              : "Đã bán — đang chờ giao hàng"}
        </Text>
        <Text style={styles.body}>
          Sản phẩm nằm trong đơn <Text style={styles.bold}>{order?.code}</Text>.
          {paid ? (
            <>
              {" "}Tiền đã cộng vào ví lúc{" "}
              <Text style={styles.bold}>
                {dayjs(order.payoutAt).format("DD/MM HH:mm")}
              </Text>
              .
            </>
          ) : holding ? (
            <>
              {" "}Tiền vào ví sau{" "}
              <Text style={styles.bold}>
                {dayjs(order.payoutDueAt).format("DD/MM HH:mm")}
              </Text>{" "}
              nếu người mua không trả hàng.
            </>
          ) : (
            " Trong lúc này bạn không giảm giá được."
          )}
        </Text>
        {order?.status ? <OrderTracker status={order.status} /> : null}
      </View>

      <PayoutBreakdown
        title="SỐ TIỀN ĐÃ CHỐT"
        price={product.currentPrice}
        priceLabel="Giá bán"
        rate={rate}
        rateLabel={`Hoa hồng kỳ ${order?.orderedTerm ?? product.currentTerm}`}
        totalLabel={paid ? "Đã cộng vào ví" : "Sẽ cộng vào ví"}
      />
      <NoteBox>
        {`Hoa hồng chốt theo kỳ đang chạy lúc đơn được đặt` +
          (order?.orderedTerm
            ? ` (kỳ ${order.orderedTerm}, ngày ${order.orderedDay})`
            : "") +
          `. Đơn giao xong sang kỳ sau vẫn tính ${formatRate(rate)}.`}
      </NoteBox>
      {paid ? null : (
        <Text style={styles.caption}>
          Tiền được cộng vào ví khi hết 3 ngày trả hàng của người mua (tính từ
          lúc giao). Người mua trả hàng hợp lệ thì đơn không tính tiền.
        </Text>
      )}
    </>
  );
}

// CHỜ XỬ LÝ CUỐI KỲ
function AwaitingBody({ product }) {
  const decision = product.endOfTermDecision;
  const left = daysLeft(decision.deadline);
  const total = productTiming(product).totalDays;
  return (
    <>
      <View style={styles.attention}>
        <Text style={styles.sectionTitle}>CẦN BẠN QUYẾT ĐỊNH</Text>
        <Text style={styles.bigTitle}>
          Còn {left} ngày để chọn cách xử lý món hàng
        </Text>
        <Text style={styles.body}>
          Đã hết {total} ngày trên sàn ({fmtDate(product.endOfTermDeadline)}).
          Hạn phản hồi:{" "}
          <Text style={styles.bold}>{fmtDate(decision.deadline)}</Text>.
        </Text>
        <View style={styles.warning}>
          <Text style={styles.body}>
            Quá hạn mà không phản hồi, món hàng được xem là{" "}
            <Text style={styles.bold}>vô thừa nhận</Text>: bạn mất quyền sở hữu,
            ReHome chuyển cho tổ chức từ thiện đối tác và không bồi hoàn.
          </Text>
        </View>
      </View>

      {product.termHistory?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LỊCH SỬ KÝ GỬI</Text>
          {product.termHistory.map((h) => (
            <View key={h.term} style={styles.historyRow}>
              <Text style={styles.body}>
                Kỳ {h.term} · giá {formatVnd(h.price)}
              </Text>
              <Text style={styles.muted}>không bán được</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.option}>
        <Text style={styles.boxTitle}>Nhận lại hàng</Text>
        <Text style={styles.body}>
          Đến {product.warehouseName} lấy hàng về.{" "}
          <Text style={styles.bold}>Miễn phí</Text> — không tính phí rút hàng ở
          bước này.
        </Text>
      </View>
      <View style={styles.option}>
        <Text style={styles.boxTitle}>Ký gửi lại với giá mới</Text>
        <Text style={styles.body}>
          Moderator đề xuất giá mới, bạn đồng ý thì ký biên nhận mới. Hàng vẫn ở
          địa điểm ký gửi, bạn không phải đi lại. Chu kỳ
          {` ${total}`} ngày tính lại từ đầu, hoa hồng về mức kỳ 1.
        </Text>
      </View>
    </>
  );
}

// Nút ở đáy theo trạng thái
function Footer({ product, view }) {
  const base = `/my-products/${product.id}`;
  if (view === PRODUCT_VIEW.SELLING) {
    return (
      <View style={styles.footerRow}>
        <Button
          title="Rút hàng về"
          variant="secondary"
          style={styles.flex}
          onPress={() =>
            router.push({
              pathname: "/withdrawals/new",
              params: { productId: product.id },
            })
          }
        />
        <Button
          title="Giảm giá bán"
          style={styles.flex}
          onPress={() => router.push(`${base}/reduce-price`)}
        />
      </View>
    );
  }
  if (view === PRODUCT_VIEW.WITHDRAWING) {
    return (
      <Button
        title="Xem yêu cầu rút hàng"
        onPress={() =>
          router.push(`/withdrawals/${product.activeWithdrawalId}`)
        }
      />
    );
  }
  if (view === PRODUCT_VIEW.DEGRADED_DECISION) {
    return (
      <Button
        title="Chọn cách đền"
        onPress={() =>
          router.push(`/degraded-cases/${product.degradedCase.id}`)
        }
      />
    );
  }

  if (view === PRODUCT_VIEW.AWAITING_DECISION) {
    return (
      <View style={styles.footerRow}>
        <Button
          title="Nhận lại hàng"
          variant="secondary"
          style={styles.flex}
          onPress={() =>
            router.push({
              pathname: `${base}/end-of-term`,
              params: { choice: "TAKE_BACK" },
            })
          }
        />
        <Button
          title="Ký gửi lại"
          style={styles.flex}
          onPress={() =>
            router.push({
              pathname: `${base}/end-of-term`,
              params: { choice: "RE_CONSIGN" },
            })
          }
        />
      </View>
    );
  }
  if (view === PRODUCT_VIEW.REPRICING) {
    return (
      <Button
        title="Xem tiến trình ký gửi lại"
        onPress={() => router.push(`${base}/reconsign`)}
      />
    );
  }
  return null; // Đã có đơn / Kết thúc: không có thao tác
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Sản phẩm ký gửi" onBack={goBack} />;

  if (query.isPending) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }
  if (query.isError) {
    const notFound = query.error.status === 403 || query.error.status === 404;
    return (
      <Screen header={header}>
        {notFound ? (
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm không tồn tại hoặc bạn không có quyền xem."
          >
            <Button title="Quay lại" onPress={goBack} />
          </EmptyState>
        ) : (
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        )}
      </Screen>
    );
  }

  const product = query.data;
  const view = getProductView(product);
  const t = view === PRODUCT_VIEW.SELLING ? productTiming(product) : null;
  const footer = <Footer product={product} view={view} />;

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        view === PRODUCT_VIEW.HAS_ORDER ||
        view === PRODUCT_VIEW.ENDED ||
        view === PRODUCT_VIEW.PICKUP
          ? null
          : footer
      }
    >
      {t?.isLastTerm ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.body, styles.flex]}>
            <Text style={styles.bold}>
              Còn {t.termDaysLeft} ngày là hết kỳ cuối.
            </Text>{" "}
            Sau {fmtShort(product.endOfTermDeadline)}, sản phẩm được gỡ khỏi sàn
            và bạn phải chọn cách xử lý trong 30 ngày.
          </Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[colors.primary]}
          />
        }
      >
        <ProductHead product={product} />
        {view === PRODUCT_VIEW.SELLING ? (
          <SellingBody product={product} />
        ) : null}
        {view === PRODUCT_VIEW.HAS_ORDER ? (
          <OrderBody product={product} />
        ) : null}
        {view === PRODUCT_VIEW.AWAITING_DECISION ? (
          <AwaitingBody product={product} />
        ) : null}
        {view === PRODUCT_VIEW.PICKUP ? <PickupInfo product={product} /> : null}
        {view === PRODUCT_VIEW.DEGRADED_DECISION ? (
          <View style={styles.attention}>
            <Text style={styles.boxTitle}>Hàng bị hỏng khi trả về địa điểm ký gửi</Text>
            <Text style={styles.body}>
              Người mua đã trả món này và hàng bị hỏng trên đường về địa điểm ký gửi.{" "}
              <Text style={styles.bold}>Không phải lỗi của bạn</Text> — ReHome đền
              bù. Bạn chọn nhận tiền đền hoặc nhận lại hàng kèm đền một phần
              {product.degradedCase?.decisionDeadline
                ? ` trước ${fmtDate(product.degradedCase.decisionDeadline)}`
                : ""}
              .
            </Text>
          </View>
        ) : null}

        {view === PRODUCT_VIEW.WITHDRAWING ? (
          <View style={styles.attention}>
            <Text style={styles.boxTitle}>Chờ bạn đến địa điểm lấy hàng</Text>
            <Text style={styles.body}>
              Sản phẩm đã gỡ khỏi sàn. Đến {product.warehouseName}
              {product.withdrawalPickupDeadline
                ? ` trước ${fmtDate(product.withdrawalPickupDeadline)}`
                : ""}
              , đọc mã Member tại quầy để nhận lại hàng.
            </Text>
          </View>
        ) : null}

        {view === PRODUCT_VIEW.REPRICING ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>Đang chờ ReHome đề xuất giá mới</Text>
            <Text style={styles.body}>
              Bạn đã chọn ký gửi lại. Moderator {product.warehouseName} sẽ xem
              lại tình trạng món hàng và đề xuất giá mới, thường trong 1–2 ngày
              làm việc.
            </Text>
          </View>
        ) : null}
        {/* Đã bán: BE trả kèm order (payoutDueAt / payoutAt) → hiện mốc tiền vào ví */}
        {view === PRODUCT_VIEW.ENDED && product.order ? (
          <OrderBody product={product} />
        ) : product.status === PRODUCT_STATUS.RETURNED ? (
          <NoteBox>
            Người mua đã trả lại món này nên đơn không tính tiền cho bạn. Hàng
            đang ở địa điểm ký gửi, ReHome sẽ liên hệ bạn về cách xử lý tiếp
            theo.
          </NoteBox>
        ) : view === PRODUCT_VIEW.ENDED ? (
          <NoteBox>{`Sản phẩm đã kết thúc ký gửi: ${PRODUCT_ENDED_LABEL[product.status] ?? product.status}.`}</NoteBox>
        ) : null}
        {/* Biên nhận đang áp dụng (hợp đồng): xem lại, tải PDF bất cứ lúc nào. [CHỜ BE] receiptId */}
        {product.receiptId ? (
          <Button
            title="Xem biên nhận ký gửi"
            variant="secondary"
            onPress={() => router.push(`/receipts/${product.receiptId}`)}
          />
        ) : null}
        <MessageWarehouseButton
          warehouseId={product.warehouseId}
          warehouseName={product.warehouseName}
          draft={`Cho mình hỏi về món ký gửi ${product.name} (SKU ${product.id}): `}
          from={`/my-products/${product.id}`}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.neutral,
  },
  head: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  headInfo: { flex: 1, gap: 2 },
  headTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  name: { flex: 1, ...textStyles.heading, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  bigTitle: { ...textStyles.title, color: colors.text },
  boxTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  infoBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  attention: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  warning: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  historyRow: { flexDirection: "row", justifyContent: "space-between" },
  option: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  tracker: { flexDirection: "row", marginTop: spacing.sm },
  trackStep: { flex: 1, alignItems: "center", gap: spacing.xs },
  trackDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral,
    backgroundColor: colors.surface,
  },
  trackDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackActive: { borderColor: colors.primary, borderWidth: 6 },
  trackLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
});
