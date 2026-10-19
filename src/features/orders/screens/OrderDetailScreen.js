import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { formatCountdown } from "@/hooks/useCountdown";
import { ERROR_CODES } from "@/constants/errorCodes";
import { CANCEL_REASON_LABEL, ORDER_STATUS as S } from "@/constants/order";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { ordersApi } from "../api/ordersApi";
import { useOrder, useOrderMutation, useTracking } from "../hooks/useOrders";
import { useSecondsLeft } from "../hooks/useSecondsLeft";
import { toDate } from "../utils/time";
import {
  canCancel,
  canConfirm,
  canPay,
  canRate,
  formatTimeLeft,
  orderStepOf,
  wasRefunded,
} from "../utils/orderRules";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStepper } from "../components/OrderStepper";
import { OrderItemRow } from "../components/OrderItemRow";
import { ConfirmReceiptDialog } from "../components/ConfirmReceiptDialog";
import { OrderMockPanel } from "../components/OrderMockPanel";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/orders");
const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");
// [KIỂM TRA] trang tra cứu công khai của GHN (PHASE4_GUIDE câu 7)
const ghnUrl = (code) =>
  `https://donhang.ghn.vn/?order_code=${encodeURIComponent(code)}`;
const CHECKLIST = [
  "Đúng món, đúng size như mô tả",
  "Tình trạng khớp với kết luận kiểm định",
  "Không rách, bẩn hay hỏng khi vận chuyển",
];

// Khung thông tin nổi bật (viền đậm) — dùng cho mọi trạng thái
function InfoBox({ title, children, strong }) {
  return (
    <View style={[styles.infoBox, strong && styles.infoBoxStrong]}>
      {title ? <Text style={styles.infoTitle}>{title}</Text> : null}
      {typeof children === "string" ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MoneyRow({ label, value, strong }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={strong ? styles.strong : styles.muted}>{label}</Text>
      <Text style={strong ? styles.total : styles.text}>{value}</Text>
    </View>
  );
}

// Chờ thanh toán: đếm ngược theo BE; về 0 → tải lại (BE tự huỷ)
function PendingBlock({ order, onExpire }) {
  const left = useSecondsLeft(
    order.paymentDeadline ? toDate(order.paymentDeadline).valueOf() : 0,
  );
  useEffect(() => {
    if (left === 0) onExpire();
  }, [left === 0]);
  return (
    <InfoBox
      strong
      title={
        left > 0
          ? `Còn ${formatCountdown(left)} để thanh toán`
          : "Đã hết hạn thanh toán"
      }
    >
      {left > 0
        ? "Hàng đang được giữ cho bạn. Hết giờ mà chưa thanh toán, đơn tự huỷ và hàng mở bán lại."
        : "Đơn sẽ tự huỷ, các món được mở bán lại."}
    </InfoBox>
  );
}

// BR-11 · Chi tiết đơn (7 trạng thái)
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useOrder(id);
  const order = query.data;
  const shipping = order?.status === S.SHIPPING;
  const tracking = useTracking(id, shipping);
  const addresses = useAddresses();
  const cancel = useOrderMutation(ordersApi.cancelOrder);
  const [confirming, setConfirming] = useState(false);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = (
    <AppHeader title={order?.orderNo ?? "Chi tiết đơn"} onBack={goBack} />
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
        {query.error.status === 404 || query.error.status === 403 ? (
          <EmptyState icon="receipt-outline" title="Không tìm thấy đơn hàng" />
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

  // Địa chỉ: bản chụp nếu BE trả; chưa có [CHỜ BE câu 4c] → tìm trong sổ địa chỉ theo id
  const address =
    order.shippingAddress ??
    addresses.data?.find((a) => a.id === order.shippingAddressId);

  const subline =
    {
      [S.DELIVERED]: `Giao lúc ${fmt(order.deliveredAt)} · ${order.warehouseName}`,
      [S.COMPLETED]: `Hoàn thành ${order.completedAt ? toDate(order.completedAt).format("DD/MM/YYYY") : ""} · ${order.warehouseName}`,
      [S.CANCELLED]: order.warehouseName,
    }[order.status] ??
    `Đặt lúc ${fmt(order.createdAt)} · ${order.warehouseName}`;

  const confirmCancel = () =>
    Alert.alert(
      `Huỷ đơn ${order.orderNo}?`,
      `Bạn được hoàn ${formatVnd(order.totalAmount)} (gồm phí vận chuyển) vào ví ReHome.`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Huỷ đơn",
          style: "destructive",
          onPress: () =>
            cancel.mutate(order.id, {
              onSuccess: () => showToast("Đã huỷ đơn, hoàn tiền vào ví"),
              onError: (e) =>
                showToast(
                  e.code === ERROR_CODES.CANNOT_CANCEL_AFTER_PACKING
                    ? "Kho vừa đóng gói, không huỷ được nữa"
                    : e.message,
                ),
            }),
        },
      ],
    );

  const copyCode = async () => {
    await Clipboard.setStringAsync(order.ghnTrackingCode);
    showToast("Đã sao chép mã vận đơn");
  };

  // Nút chính theo trạng thái
  let footer = null;
  if (canPay(order)) {
    footer = (
      <Button
        title={`Thanh toán · ${formatVnd(order.totalAmount)}`}
        onPress={() =>
          router.push({ pathname: "/payment", params: { orderIds: order.id } })
        }
      />
    );
  } else if (canCancel(order)) {
    footer = (
      <Button
        title="Huỷ đơn — hoàn 100%"
        variant="secondary"
        loading={cancel.isPending}
        onPress={confirmCancel}
      />
    );
  } else if (shipping && order.ghnTrackingCode) {
    footer = (
      <Button
        title="Xem trên GHN"
        variant="secondary"
        onPress={() => Linking.openURL(ghnUrl(order.ghnTrackingCode))}
      />
    );
  } else if (canConfirm(order)) {
    footer = (
      <Button
        title="Xác nhận đã nhận hàng"
        onPress={() => setConfirming(true)}
      />
    );
  } else if (order.status === S.COMPLETED) {
    footer = (
      <Button
        title={canRate(order) ? "Đánh giá dịch vụ" : "Xem đánh giá của bạn"}
        variant={canRate(order) ? "primary" : "secondary"}
        onPress={() => router.push(`/orders/${order.id}/rating`)} // nhánh 2: BR-14
      />
    );
  } else if (
    order.status === S.CANCELLED &&
    order.items.length === 1 &&
    order.items[0].productId
  ) {
    footer = (
      <Button
        title="Mua lại món này"
        variant="secondary"
        onPress={() => router.push(`/products/${order.items[0].productId}`)}
      />
    );
  }

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.topRow}>
        <Text style={styles.muted}>{subline}</Text>
        <OrderStatusBadge status={order.status} />
      </View>

      {orderStepOf(order) >= 0 ? (
        <OrderStepper step={orderStepOf(order)} />
      ) : null}

      {/* ---- Khối theo trạng thái ---- */}
      {order.status === S.PENDING_PAYMENT ? (
        <PendingBlock order={order} onExpire={() => query.refetch()} />
      ) : null}

      {order.status === S.PAID ? (
        <InfoBox strong title="Vẫn huỷ được">
          Kho chưa đóng gói. Huỷ bây giờ bạn được hoàn 100%, kể cả phí vận
          chuyển, tiền vào thẳng ví ReHome. Khi kho bắt đầu đóng gói thì không
          huỷ được nữa, chỉ còn cách trả hàng sau khi nhận.
        </InfoBox>
      ) : null}

      {order.status === S.PACKING ? (
        <InfoBox title="Kho đang đóng gói">
          Đơn không huỷ được nữa. Kho sẽ bàn giao cho GHN sớm.
        </InfoBox>
      ) : null}

      {shipping ? (
        <>
          {order.ghnTrackingCode ? (
            <View style={styles.codeBox}>
              <View style={styles.flex}>
                <Text style={styles.muted}>Mã vận đơn GHN</Text>
                <Text style={styles.code}>{order.ghnTrackingCode}</Text>
              </View>
              <Button
                title="Sao chép"
                variant="secondary"
                onPress={copyCode}
                style={styles.smallBtn}
              />
            </View>
          ) : null}
          <Section title="HÀNH TRÌNH">
            {(tracking.data?.events ?? []).slice(0, 3).map((e, i) => (
              <View key={`${e.timestamp}-${i}`} style={styles.event}>
                <View
                  style={[styles.eventDot, i === 0 && styles.eventDotNow]}
                />
                <View style={styles.flex}>
                  <Text style={i === 0 ? styles.strong : styles.text}>
                    {e.label ?? e.status}
                  </Text>
                  <Text style={styles.muted}>
                    {fmt(e.timestamp)}
                    {e.location ? ` · ${e.location}` : ""}
                  </Text>
                </View>
              </View>
            ))}
            {tracking.data && !tracking.data.events.length ? (
              <Text style={styles.muted}>Chưa có cập nhật từ GHN.</Text>
            ) : null}
          </Section>
          <InfoBox title="Không huỷ đơn được nữa">
            Hàng đã rời kho. Nếu nhận hàng không đúng mô tả, bạn có 3 ngày kể từ
            khi nhận để gửi yêu cầu trả hàng.
          </InfoBox>
        </>
      ) : null}

      {order.status === S.DELIVERED ? (
        <>
          <InfoBox strong title="Bạn đã nhận được hàng chưa?">
            <Text style={styles.text}>
              Kiểm tra hàng rồi bấm xác nhận. Không bấm cũng không sao — hệ
              thống tự hoàn thành đơn sau{" "}
              <Text style={styles.strong}>
                {formatTimeLeft(order.autoCompleteDeadline)}
              </Text>{" "}
              nữa.
            </Text>
            <View style={styles.innerNote}>
              <Text style={styles.text}>
                Xác nhận{" "}
                <Text style={styles.strong}>không làm mất quyền trả hàng</Text>.
                Bạn vẫn có 3 ngày kể từ khi nhận để gửi yêu cầu trả.
              </Text>
            </View>
          </InfoBox>
          {/* PHASE4_GUIDE 0.4 #2: gợi ý kiểm hàng, không bắt tích */}
          <Section title="NÊN KIỂM TRA TRƯỚC KHI XÁC NHẬN">
            {CHECKLIST.map((c) => (
              <Text key={c} style={styles.text}>
                • {c}
              </Text>
            ))}
          </Section>
        </>
      ) : null}

      {order.status === S.COMPLETED ? (
        <Section
          title={
            order.serviceRating != null ? "ĐÁNH GIÁ CỦA BẠN" : "CHƯA ĐÁNH GIÁ"
          }
        >
          <Text style={styles.stars}>
            {"★".repeat(order.serviceRating ?? 0)}
            {"☆".repeat(5 - (order.serviceRating ?? 0))}
          </Text>
          <Text style={styles.muted}>
            {order.serviceRating != null
              ? `${order.serviceRating}/5 · dịch vụ của kho`
              : "Chấm dịch vụ đóng gói và giao hàng của kho"}
          </Text>
        </Section>
      ) : null}

      {order.status === S.CANCELLED ? (
        <>
          <InfoBox title="Lý do huỷ">
            {`${CANCEL_REASON_LABEL[order.cancelReason] ?? "Đơn đã huỷ."}${order.cancelledAt ? ` (${fmt(order.cancelledAt)})` : ""}`}
          </InfoBox>
          {wasRefunded(order) ? (
            <InfoBox strong title="ĐÃ HOÀN TIỀN">
              <Text style={styles.refund}>{formatVnd(order.refundAmount)}</Text>
              <MoneyRow label="Tiền hàng" value={formatVnd(order.subtotal)} />
              <MoneyRow
                label="Phí vận chuyển"
                value={formatVnd(order.shippingFee)}
              />
              <View style={styles.innerNote}>
                <Text style={styles.text}>
                  Hoàn{" "}
                  <Text style={styles.strong}>100%, gồm cả phí vận chuyển</Text>
                  . Tiền vào <Text style={styles.strong}>ví ReHome</Text>
                  {order.cancelledAt ? ` lúc ${fmt(order.cancelledAt)}` : ""},
                  không chuyển về tài khoản ngân hàng.
                </Text>
              </View>
            </InfoBox>
          ) : null}
        </>
      ) : null}

      {/* ---- Phần chung ---- */}
      <Section title="SẢN PHẨM">
        {order.items.map((it, i) => (
          <OrderItemRow key={`${it.productId ?? "x"}-${i}`} item={it} />
        ))}
      </Section>

      {address ? (
        <Section title="GIAO ĐẾN">
          <Text style={styles.strong}>
            {address.recipientName} · {formatPhone(address.phone)}
          </Text>
          <Text style={styles.muted}>{address.addressDetail}</Text>
        </Section>
      ) : null}

      <Section title="THANH TOÁN">
        <MoneyRow label="Tiền hàng" value={formatVnd(order.subtotal)} />
        <MoneyRow label="Phí vận chuyển" value={formatVnd(order.shippingFee)} />
        <MoneyRow
          strong
          label={
            order.paidAt
              ? `Đã thanh toán qua ${order.paymentMethod === "WALLET" ? "Ví ReHome" : "MoMo"}`
              : "Tổng"
          }
          value={formatVnd(order.totalAmount)}
        />
      </Section>

      {order.status === S.CANCELLED && wasRefunded(order) ? (
        <NoteBox>
          Số dư ví dùng được ngay để mua món khác, hoặc tạo yêu cầu rút tiền
          trong mục Ví.
        </NoteBox>
      ) : null}

      <OrderMockPanel order={order} />

      {confirming ? (
        <ConfirmReceiptDialog
          order={order}
          onClose={() => setConfirming(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  infoBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  infoBoxStrong: { borderWidth: 2, borderColor: colors.text },
  infoTitle: { ...textStyles.heading, color: colors.text },
  innerNote: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  total: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  refund: {
    ...textStyles.title,
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: radius.input,
  },
  code: { ...textStyles.title, letterSpacing: 1, color: colors.text },
  smallBtn: { minHeight: 36, paddingHorizontal: spacing.md },
  event: { flexDirection: "row", gap: spacing.md },
  eventDot: {
    width: 12,
    height: 12,
    marginTop: 4,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  eventDotNow: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
  },
  stars: { fontSize: 28, color: colors.text, letterSpacing: 4 },
});
