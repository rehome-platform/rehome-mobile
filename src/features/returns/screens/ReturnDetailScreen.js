import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
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
  INVALID_RETURN_CHOICE_LABEL,
  RETURN_CANCEL_REASON,
  RETURN_STATUS as R,
} from "@/constants/returns";
import { toDate } from "@/features/orders/utils/time";
import { formatTimeLeft } from "@/features/orders/utils/orderRules";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { returnsApi } from "../api/returnsApi";
import { useReturn, useReturnMutation } from "../hooks/useReturns";
import { splitReasonText, wasRefunded } from "../utils/returnRules";
import { ReturnStatusBadge } from "../components/ReturnStatusBadge";
import { ReturnStatusTimeline } from "../components/ReturnStatusTimeline";
import { PhotoThumbs } from "../components/PhotoThumbs";
import { ReturnMockPanel } from "../components/ReturnMockPanel";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/returns");
const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");

const PACKING_TIPS = [
  "Giữ nguyên tem SKU của ReHome trên món đồ",
  "Dùng lại túi hoặc thùng của đơn gốc nếu còn",
  "Shipper mang phiếu trả hàng tới, bạn không cần in",
];

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
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
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
  const choosing = r.status === R.INVALID && !r.invalidReturnChoice;

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
              onSuccess: () => showToast("Đã ghi nhận, hàng đang về kho"),
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
  } else if (r.status === R.INVALID) {
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
    <Screen
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
            {`Kho đã duyệt${r.approvedAt ? ` lúc ${fmt(r.approvedAt)}` : ""}. Shipper GHN sẽ tới lấy hàng tại địa chỉ bên dưới.`}
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
              ? "Kho đang kiểm tra hàng"
              : "Hàng đang về kho"
          }
        >
          {`Kho sẽ kiểm tra khi hàng về, thường trong 1–2 ngày làm việc.${r.ghnReturnTrackingCode ? ` Mã vận đơn: ${r.ghnReturnTrackingCode}.` : ""}`}
        </InfoBox>
      ) : null}

      {refunded ? (
        <>
          <InfoBox
            strong
            title={
              r.status === R.LOST
                ? "Hàng trả bị thất lạc trên đường về kho"
                : "Kho xác nhận yêu cầu hợp lệ"
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
              <MoneyRow label="Phí trả hàng" value="Kho chịu" />
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
          <InfoBox strong title="Kho không chấp nhận yêu cầu trả">
            <Text style={styles.text}>
              Tình trạng hàng về không khớp với lý do bạn gửi.{" "}
              <Text style={styles.strong}>Không hoàn tiền</Text>, món vẫn thuộc
              về bạn.
            </Text>
          </InfoBox>
          {r.resolutionNote ? (
            <Section title="KẾT LUẬN KIỂM ĐỊNH CỦA KHO">
              <View style={styles.infoBox}>
                <Text style={styles.text}>{r.resolutionNote}</Text>
                {r.resolutionPhotoUrls?.length ? (
                  <>
                    <Text style={styles.sectionTitle}>
                      ẢNH KHO CHỤP KHI NHẬN LẠI
                    </Text>
                    <PhotoThumbs urls={r.resolutionPhotoUrls} />
                  </>
                ) : null}
              </View>
            </Section>
          ) : null}
          {choosing ? (
            <InfoBox title="Món này đang ở kho, cần bạn chọn cách nhận">
              <Text style={styles.text}>
                Kho không giữ hàng của bạn quá 7 ngày. Còn{" "}
                <Text style={styles.strong}>
                  {formatTimeLeft(r.pickupDeadline)}
                </Text>{" "}
                để chọn và nhận lại.
              </Text>
            </InfoBox>
          ) : (
            <InfoBox
              strong
              title={`Bạn đã chọn: ${INVALID_RETURN_CHOICE_LABEL[r.invalidReturnChoice] ?? r.invalidReturnChoice}`}
            >
              {`Đến ${r.warehouseName ?? "kho"} trước ${fmt(r.pickupDeadline)}, đọc mã Member tại quầy để nhận lại hàng.`}
            </InfoBox>
          )}
        </>
      ) : null}

      {r.status === R.CANCELLED ? (
        <InfoBox title="Yêu cầu đã huỷ">
          {r.cancelReason === RETURN_CANCEL_REASON.HANDOVER_EXPIRED
            ? "Quá hạn bàn giao cho GHN nên yêu cầu tự huỷ. Đơn trở lại bình thường, hàng vẫn là của bạn."
            : `Kho từ chối yêu cầu.${r.cancelNote ? ` ${r.cancelNote}` : ""} Đơn trở lại bình thường.`}
        </InfoBox>
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
            Địa chỉ giao của đơn. Cần đổi địa chỉ thì liên hệ kho.
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
  innerBox: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
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
    borderColor: colors.text,
    borderRadius: radius.input,
  },
  code: { ...textStyles.title, letterSpacing: 1, color: colors.text },
  smallBtn: { minHeight: 36, paddingHorizontal: spacing.md },
});
