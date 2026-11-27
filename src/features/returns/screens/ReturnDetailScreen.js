import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  Linking,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { refreshActive } from "@/lib/query/refresh";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import {
  INVALID_RETURN_CHOICE as C,
  INVALID_RETURN_CHOICE_LABEL,
  RETURN_CANCEL_REASON,
  RETURN_STATUS as R,
  SHIP_BACK_LIMITS,
  SHIP_BACK_STATUS as SB,
} from "@/constants/returns";
import { PAYMENT_METHOD_LABEL } from "@/constants/order";
import { toDate } from "@/features/orders/utils/time";
import {
  formatTimeLeft,
  ghnTrackingUrl,
} from "@/features/orders/utils/orderRules";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { returnsApi } from "../api/returnsApi";
import { useReturn, useReturnMutation } from "../hooks/useReturns";
import {
  invalidPickedUp,
  invalidPickupExpired,
  shipBackAwaitingPayment,
  splitReasonText,
  wasRefunded,
} from "../utils/returnRules";
import { ReturnStatusBadge } from "../components/ReturnStatusBadge";
import { ReturnStatusTimeline } from "../components/ReturnStatusTimeline";
import { PhotoThumbs } from "../components/PhotoThumbs";
import { ReturnMockPanel } from "../components/ReturnMockPanel";
import { MessageWarehouseButton } from "@/features/chat/components/MessageWarehouseButton";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/returns");
const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");

const PACKING_TIPS = [
  "Giữ nguyên tem SKU của ReHome trên món đồ",
  "Dùng lại túi hoặc thùng của đơn gốc nếu còn",
  "Shipper mang phiếu trả hàng tới, bạn không cần in",
];

// Người mua chọn "ReHome gửi lại" (đặc tả 27/11): chờ trả phí → đã trả → đang gửi (mã GHN)
function ShipBackBox({ r }) {
  const fee = formatVnd(Number(r.shipBackFee));
  const copy = async () => {
    await Clipboard.setStringAsync(r.shipBackTrackingCode);
    showToast("Đã sao chép mã vận đơn");
  };
  const to = (
    <>
      <Text style={styles.sectionTitle}>GỬI TỚI</Text>
      <Text style={styles.strong}>
        {r.shipBackRecipientName} · {formatPhone(r.shipBackPhone)}
      </Text>
      <Text style={styles.muted}>{r.shipBackAddressDetail}</Text>
    </>
  );

  if (r.shipBackStatus === SB.AWAITING_PAYMENT)
    return (
      <InfoBox strong title={`Chờ bạn trả phí gửi lại ${fee}`}>
        <Text style={styles.text}>
          Trả trước{" "}
          <Text style={styles.strong}>
            {toDate(r.shipBackFeeDeadline).format("HH:mm DD/MM")}
          </Text>{" "}
          bằng Ví ReHome hoặc VNPay. Quá hạn thì lựa chọn gửi lại bị huỷ, bạn
          chọn lại cách nhận hàng.
        </Text>
        {to}
      </InfoBox>
    );

  if (r.shipBackStatus === SB.PAID)
    return (
      <InfoBox strong title="Đã trả phí, ReHome đang chuẩn bị gửi">
        <Text style={styles.text}>
          {`Đã trả ${fee}${r.shipBackPaymentMethod ? ` bằng ${PAYMENT_METHOD_LABEL[r.shipBackPaymentMethod] ?? r.shipBackPaymentMethod}` : ""}${r.shipBackPaidAt ? ` lúc ${fmt(r.shipBackPaidAt)}` : ""}. ReHome đóng gói và gửi trong ${SHIP_BACK_LIMITS.SHIP_WITHIN_DAYS} ngày, bạn sẽ nhận thông báo kèm mã vận đơn GHN.`}
        </Text>
        {to}
      </InfoBox>
    );

  // Dữ liệu cũ: BE đã lưu SHIP_BACK nhưng chưa có luồng gửi lại (không có shipBackStatus)
  if (r.shipBackStatus !== SB.SHIPPING)
    return (
      <InfoBox strong title="Bạn đã chọn: ReHome gửi lại cho bạn">
        Cần hỏi thêm về việc gửi lại thì bấm Nhắn ReHome bên dưới.
      </InfoBox>
    );

  return (
    <>
      <InfoBox strong title="ReHome đang gửi lại cho bạn">
        <Text style={styles.text}>
          {`Đã giao cho GHN${r.shipBackShippedAt ? ` lúc ${fmt(r.shipBackShippedAt)}` : ""}. Nhớ nghe máy khi shipper gọi — giao không thành công thì không hoàn phí và hàng về lại địa điểm ký gửi.`}
        </Text>
        {to}
      </InfoBox>
      {r.shipBackTrackingCode ? (
        <View style={styles.codeBox}>
          <View style={styles.flex}>
            <Text style={styles.muted}>Mã vận đơn GHN</Text>
            <Text style={styles.code}>{r.shipBackTrackingCode}</Text>
            <Text
              style={styles.link}
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL(ghnTrackingUrl(r.shipBackTrackingCode))
              }
            >
              Theo dõi trên GHN
            </Text>
          </View>
          <Button
            title="Sao chép"
            variant="secondary"
            onPress={copy}
            style={styles.smallBtn}
          />
        </View>
      ) : null}
    </>
  );
}

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

// RT-02 · Chi tiết yêu cầu trả (8 trạng thái)
export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useReturn(id);
  const r = query.data;
  const wallet = useWallet();
  const handover = useReturnMutation(returnsApi.confirmHandover);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = (
    <AppHeader title={r?.code ?? "Yêu cầu trả hàng"} onBack={goBack} />
  );
  if (query.isPending) {
    return (
      <Screen onRefresh={refreshActive} header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen onRefresh={refreshActive} header={header}>
        {query.error.status === 404 || query.error.status === 403 ? (
          <EmptyState
            icon="return-down-back-outline"
            title="Không tìm thấy yêu cầu trả hàng"
          />
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

  const reason = splitReasonText(r.reason);
  const refunded = wasRefunded(r);
  // Hàng không hợp lệ: đã nhận lại tại quầy (BE thêm pickedUpAt — [CHỜ BE], chưa có thì luôn null)
  // hoặc quá hạn nhận lại (hàng vô chủ) → hết việc phải làm, ẩn nút chọn cách nhận / mã Member
  const pickedUp = invalidPickedUp(r);
  const pickupExpired = invalidPickupExpired(r);
  const choosing =
    r.status === R.INVALID && !r.invalidReturnChoice && !pickedUp && !pickupExpired;

  const subline = refunded
    ? `Hoàn tất ${fmt(r.resolvedAt)}`
    : r.status === R.INVALID
      ? `Kết luận ${fmt(r.resolvedAt)}`
      : `Gửi ${fmt(r.createdAt)}`;

  const copyCode = async () => {
    await Clipboard.setStringAsync(r.ghnReturnTrackingCode);
    showToast("Đã sao chép mã vận đơn");
  };

  const confirmHandover = () =>
    Alert.alert(
      "Bạn đã giao hàng cho shipper?",
      "Chỉ xác nhận khi shipper GHN đã nhận gói hàng trả của bạn.",
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Đã giao",
          onPress: () =>
            handover.mutate(r.id, {
              onSuccess: () =>
                showToast("Đã ghi nhận, hàng đang về địa điểm ký gửi"),
              onError: (e) =>
                showToast(
                  e.code === ERROR_CODES.RETURN_HANDOVER_EXPIRED
                    ? "Đã quá hạn bàn giao, yêu cầu đã tự huỷ"
                    : e.message,
                ),
            }),
        },
      ],
    );

  // Nút chính theo trạng thái
  let footer = null;
  if (r.status === R.APPROVED) {
    footer = (
      <Button
        title="Tôi đã giao hàng cho shipper"
        loading={handover.isPending}
        onPress={confirmHandover}
      />
    );
  } else if (choosing) {
    footer = (
      <Button
        title="Chọn cách nhận lại hàng"
        onPress={() => router.push(`/returns/${r.id}/pickup-choice`)}
      />
    );
  } else if (shipBackAwaitingPayment(r) && !pickupExpired) {
    footer = (
      <Button
        title={`Trả phí gửi lại ${formatVnd(Number(r.shipBackFee))}`}
        onPress={() => router.push(`/returns/${r.id}/ship-back-pay`)}
      />
    );
  } else if (
    r.status === R.INVALID &&
    r.invalidReturnChoice === C.WAREHOUSE_PICKUP &&
    !pickedUp &&
    !pickupExpired
  ) {
    footer = (
      <Button
        title="Mã Member của tôi"
        onPress={() => router.push("/profile/member-code")}
      />
    );
  } else if (refunded) {
    footer = <Button title="Xem ví" onPress={() => router.push("/wallet")} />;
  }

  const showAddress =
    [R.PENDING, R.APPROVED].includes(r.status) && r.shippingAddressDetail;

  return (
    <Screen onRefresh={refreshActive}
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.topRow}>
        <Text style={styles.muted}>{subline}</Text>
        <ReturnStatusBadge status={r.status} />
      </View>

      {/* ---- Khối theo trạng thái ---- */}
      {r.status === R.APPROVED ? (
        <>
          <InfoBox
            strong
            title={`Còn ${formatTimeLeft(r.handoverDeadline)} để giao hàng`}
          >
            {`ReHome đã duyệt${r.approvedAt ? ` lúc ${fmt(r.approvedAt)}` : ""}. Shipper GHN sẽ tới lấy hàng tại địa chỉ bên dưới.`}
          </InfoBox>
          {r.ghnReturnTrackingCode ? (
            <View style={styles.codeBox}>
              <View style={styles.flex}>
                <Text style={styles.muted}>Mã vận đơn trả hàng</Text>
                <Text style={styles.code}>{r.ghnReturnTrackingCode}</Text>
              </View>
              <Button
                title="Sao chép"
                variant="secondary"
                onPress={copyCode}
                style={styles.smallBtn}
              />
            </View>
          ) : null}
          <Section title="ĐÓNG GÓI TRƯỚC KHI SHIPPER TỚI">
            {PACKING_TIPS.map((t) => (
              <Text key={t} style={styles.text}>
                • {t}
              </Text>
            ))}
          </Section>
          <InfoBox title="Nếu không kịp bàn giao">
            {`Quá ${fmt(r.handoverDeadline)} mà chưa giao được: yêu cầu tự huỷ, đơn trở lại bình thường, hàng vẫn là của bạn. Không bị phạt, nhưng không gửi lại yêu cầu được.`}
          </InfoBox>
        </>
      ) : null}

      {[R.SHIPPED_BACK, R.INSPECTING].includes(r.status) ? (
        <InfoBox
          title={
            r.status === R.INSPECTING
              ? "ReHome đang kiểm tra hàng"
              : "Hàng đang về địa điểm ký gửi"
          }
        >
          {`ReHome sẽ kiểm tra khi hàng về, thường trong 1–2 ngày làm việc.${r.ghnReturnTrackingCode ? ` Mã vận đơn: ${r.ghnReturnTrackingCode}.` : ""}`}
        </InfoBox>
      ) : null}

      {refunded ? (
        <>
          <InfoBox
            strong
            title={
              r.status === R.LOST
                ? "Hàng trả bị thất lạc trên đường về địa điểm ký gửi"
                : "ReHome xác nhận yêu cầu hợp lệ"
            }
          >
            {r.status === R.LOST ? (
              <Text style={styles.text}>ReHome vẫn hoàn tiền cho bạn.</Text>
            ) : null}
            <View style={styles.innerBox}>
              <MoneyRow label="Tiền hàng" value={formatVnd(r.subtotal)} />
              <MoneyRow
                label="Phí vận chuyển đơn gốc"
                value={formatVnd(r.shippingFee)}
              />
              <MoneyRow label="Phí trả hàng" value="ReHome chịu" />
              <View style={styles.divider} />
              <MoneyRow
                strong
                label="Đã hoàn vào ví"
                value={formatVnd(r.refundAmount)}
              />
            </View>
          </InfoBox>
          {wallet.data ? (
            <View style={styles.balance}>
              <Text style={styles.muted}>Số dư ví hiện tại</Text>
              <Text style={styles.total}>{formatVnd(wallet.data.balance)}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {r.status === R.INVALID ? (
        <>
          <InfoBox strong title="ReHome không chấp nhận yêu cầu trả">
            <Text style={styles.text}>
              Tình trạng hàng về không khớp với lý do bạn gửi.{" "}
              <Text style={styles.strong}>Không hoàn tiền</Text>, món vẫn thuộc
              về bạn.
            </Text>
          </InfoBox>
          {r.resolutionNote ? (
            <Section title="KẾT LUẬN KIỂM ĐỊNH CỦA REHOME">
              <View style={styles.infoBox}>
                <Text style={styles.text}>{r.resolutionNote}</Text>
                {r.resolutionPhotoUrls?.length ? (
                  <>
                    <Text style={styles.sectionTitle}>
                      ẢNH REHOME CHỤP KHI NHẬN LẠI
                    </Text>
                    <PhotoThumbs urls={r.resolutionPhotoUrls} />
                  </>
                ) : null}
              </View>
            </Section>
          ) : null}
          {pickedUp ? (
            <InfoBox strong title="Bạn đã nhận lại hàng">
              {r.shipBackStatus === SB.DELIVERED
                ? `GHN đã giao tới ${r.shipBackAddressDetail ?? "địa chỉ của bạn"} lúc ${fmt(r.shipBackDeliveredAt)}. Yêu cầu trả hàng đã kết thúc.`
                : `Đã nhận tại ${r.warehouseName ?? "địa điểm ký gửi"} lúc ${fmt(r.pickedUpAt)}. Yêu cầu trả hàng đã kết thúc.`}
            </InfoBox>
          ) : r.invalidReturnChoice === C.SHIP_BACK && !pickupExpired ? (
            <ShipBackBox r={r} />
          ) : pickupExpired ? (
            <InfoBox strong title="Đã hết hạn nhận lại hàng">
              {`Hết hạn ${fmt(r.pickupDeadline)} mà bạn chưa nhận lại hàng. Món thành hàng vô chủ và ReHome xử lý theo quy định.`}
            </InfoBox>
          ) : choosing ? (
            <InfoBox title="Món này đang ở địa điểm ký gửi, cần bạn chọn cách nhận">
              <Text style={styles.text}>
                ReHome chỉ giữ hàng của bạn trong thời hạn có giới hạn. Còn{" "}
                <Text style={styles.strong}>
                  {formatTimeLeft(r.pickupDeadline)}
                </Text>{" "}
                để chọn và nhận lại.
              </Text>
            </InfoBox>
          ) : (
            <>
            {/* Gửi lại thất bại: GHN hoàn hàng về kho → BE chuyển sang đến lấy, hạn mới; không hoàn phí */}
            {r.shipBackStatus === SB.FAILED ? (
              <InfoBox title="Giao không thành công">
                {`GHN không giao được nên hàng đã về ${r.warehouseName ?? "địa điểm ký gửi"}${r.shipBackFailedAt ? ` (${fmt(r.shipBackFailedAt)})` : ""}. Phí gửi lại không được hoàn. Bạn đến địa điểm lấy hàng trước hạn bên dưới.`}
              </InfoBox>
            ) : null}
            <InfoBox
              strong
              title={`Bạn đã chọn: ${INVALID_RETURN_CHOICE_LABEL[r.invalidReturnChoice] ?? r.invalidReturnChoice}`}
            >
              <Text style={styles.text}>
                Đến {r.warehouseName ?? "địa điểm ký gửi"} trước{" "}
                <Text style={styles.strong}>{fmt(r.pickupDeadline)}</Text>, đọc
                mã Member tại quầy để nhận lại hàng.
              </Text>
              {r.warehouseAddress ? (
                <Text style={styles.muted}>{r.warehouseAddress}</Text>
              ) : null}
              {r.warehouseAddress ? (
                <Text
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={() =>
                    Linking.openURL(
                      `geo:0,0?q=${encodeURIComponent(r.warehouseAddress)}`,
                    )
                  }
                >
                  Chỉ đường
                </Text>
              ) : null}
            </InfoBox>
            </>
          )}
        </>
      ) : null}

      {/* Từ chối lúc duyệt: món CHƯA rời tay người mua (chưa gửi GHN) → giữ món, không hoàn tiền, không có bước nhận lại */}
      {r.status === R.CANCELLED ? (
        r.cancelReason === RETURN_CANCEL_REASON.HANDOVER_EXPIRED ? (
          <InfoBox title="Yêu cầu đã huỷ">
            Quá hạn bàn giao cho GHN nên yêu cầu tự huỷ. Đơn trở lại bình
            thường, hàng vẫn là của bạn.
          </InfoBox>
        ) : (
          <InfoBox title="ReHome từ chối yêu cầu trả hàng">
            {`${r.cancelNote ? `Lý do: ${r.cancelNote}\n` : ""}Món vẫn ở chỗ bạn, không cần gửi trả và không được hoàn tiền. Đơn trở lại bình thường. Cần hỏi thêm thì bấm Nhắn ReHome bên dưới.`}
          </InfoBox>
        )
      ) : null}

      {/* ---- Phần chung ---- */}
      {r.status !== R.CANCELLED ? (
        <Section title="TIẾN TRÌNH">
          <ReturnStatusTimeline item={r} />
        </Section>
      ) : null}

      <Section title={`MÓN TRẢ · ${r.items.length} MÓN`}>
        {r.items.map((it, i) => (
          <OrderItemRow key={`${it.productId ?? "x"}-${i}`} item={it} />
        ))}
      </Section>

      <Section title="LÝ DO BẠN ĐÃ GỬI">
        {reason.title ? (
          <Text style={styles.strong}>{reason.title}</Text>
        ) : null}
        {reason.detail ? (
          <Text style={styles.text}>{reason.detail}</Text>
        ) : null}
        <PhotoThumbs urls={r.photoUrls} />
      </Section>

      {showAddress ? (
        <Section title="NƠI SHIPPER TỚI LẤY HÀNG">
          <View style={styles.infoBox}>
            <Text style={styles.strong}>
              {r.shippingRecipientName} · {formatPhone(r.shippingPhone)}
            </Text>
            <Text style={styles.muted}>{r.shippingAddressDetail}</Text>
          </View>
          <Text style={styles.caption}>
            Địa chỉ giao của đơn. Cần đổi địa chỉ thì liên hệ ReHome.
          </Text>
        </Section>
      ) : null}
      {r.orderId ? (
        <Button
          title={`Xem đơn hàng ${r.orderNo ?? ""}`}
          variant="text"
          onPress={() => router.push(`/orders/${r.orderId}`)}
        />
      ) : null}
      <MessageWarehouseButton
        warehouseId={r.warehouseId}
        warehouseName={r.warehouseName}
        title={
          r.status === R.INVALID
            ? "Khiếu nại kết luận / nhắn ReHome"
            : "Nhắn ReHome"
        }
        draft={
          r.status === R.INVALID
            ? `Mình muốn khiếu nại kết luận yêu cầu trả hàng ${r.code ?? ""}: `
            : `Cho mình hỏi về yêu cầu trả hàng ${r.code ?? ""} (đơn ${r.orderNo ?? ""}): `
        }
        from={`/returns/${r.id}`}
      />

      {refunded ? (
        <NoteBox>
          Tiền hoàn nằm trong ví ReHome, dùng được ngay để mua món khác hoặc tạo
          yêu cầu rút tiền.
        </NoteBox>
      ) : null}

      <ReturnMockPanel item={r} />
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
  caption: { ...textStyles.caption, color: colors.textSecondary },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
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
  infoBoxStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  infoTitle: { ...textStyles.heading, color: colors.text },
  innerBox: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
    backgroundColor: colors.neutral,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  total: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  balance: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
  },
  code: { ...textStyles.title, letterSpacing: 1, color: colors.text },
  smallBtn: { minHeight: 36, paddingHorizontal: spacing.md },
});
