import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
// Native: có sẵn trong Expo Go; bản dev build APK phải build lại sau khi thêm thư viện này
import * as Sharing from "expo-sharing";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import { ERROR_CODES } from "@/constants/errorCodes";
import { RECEIPT_STATUS } from "@/constants/consignment";
import {
  commissionRates,
  formatRate,
  totalTermDays,
} from "@/utils/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { otherClauses } from "@/features/consignment/receiptTerms";
import { KeyValueTable } from "@/features/consignment/components/KeyValueTable";
import { ReceiptConfirmModal } from "@/features/consignment/components/ReceiptConfirmModal";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmtDate = (d) => dayjs(d).format("DD/MM/YYYY");
const fmtTime = (d) => dayjs(d).format("HH:mm DD/MM/YYYY");

// [CHỜ BE] Biên nhận đã huỷ: BE trả status VOIDED (kèm voidedAt). Chưa có status thì coi như chưa huỷ
const isVoided = (r) => r.status === RECEIPT_STATUS.VOIDED || !!r.voidedAt;

// "Áo khoác jean Levi's — Levi's, size M" (thiếu phần nào thì bỏ phần đó)
const productLine = (r) =>
  [
    r.productName,
    [r.brandName, r.size ? `size ${r.size}` : null].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" — ");

function Clause({ title, children }) {
  return (
    <View style={styles.clause}>
      <Text style={styles.clauseTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Toàn bộ điều khoản, ĐÚNG thứ tự Điều 1 → 10 — dùng cho bản Chờ xác nhận và "Toàn văn" của bản Đã xác nhận
function ReceiptClauses({ receipt }) {
  const rates = commissionRates(receipt);
  const days = totalTermDays(receipt);
  const L = receipt.termLengthDays;
  return (
    <>
      <Clause title="ĐIỀU 1 — HÀNG HOÁ">
        <KeyValueTable
          rows={[
            { label: "Sản phẩm", value: productLine(receipt) },
            ...(receipt.sku ? [{ label: "Mã SKU", value: receipt.sku }] : []),
            ...(receipt.conditionNote
              ? [{ label: "Kiểm định", value: receipt.conditionNote }]
              : []),
          ]}
        />
      </Clause>

      <Clause title="ĐIỀU 2 — GIÁ BÁN VÀ HOA HỒNG">
        <View style={styles.prices}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá bán niêm yết</Text>
            <Text style={styles.priceValue}>
              {formatVnd(receipt.agreedPrice)}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá sàn</Text>
            <Text style={styles.priceValue}>
              {formatVnd(receipt.floorPrice)}
            </Text>
          </View>
        </View>
        <View style={styles.termTable}>
          <View style={[styles.termRow, styles.termHead]}>
            <Text style={[styles.termCell, styles.termHeadText]}>Kỳ</Text>
            <Text style={[styles.termCellWide, styles.termHeadText]}>
              Thời gian
            </Text>
            <Text style={[styles.termCellRight, styles.termHeadText]}>
              Hoa hồng
            </Text>
          </View>
          {rates.map((rate, i) => (
            <View key={i} style={[styles.termRow, styles.divider]}>
              <Text style={styles.termCell}>Kỳ {i + 1}</Text>
              <Text style={styles.termCellWide}>
                Ngày {i * L + (i ? 1 : 0)} – {(i + 1) * L}
              </Text>
              <Text style={[styles.termCellRight, styles.bold]}>
                {formatRate(rate)}
              </Text>
            </View>
          ))}
        </View>
      </Clause>

      <Clause title="ĐIỀU 3 — THỜI HẠN">
        <Text style={styles.body}>
          Một kỳ {L} ngày, tự gia hạn tối đa {receipt.maxRenewals} lần, tổng
          không quá {days} ngày. Mỗi lần sang kỳ mới bạn có{" "}
          {receipt.freeWithdrawalWindowDays} ngày rút hàng không mất phí.
        </Text>
      </Clause>
      {otherClauses(receipt)
        .filter((c) => c.no < 8)
        .map((c) => (
          <FoldClause key={c.no} clause={c} />
        ))}

      <View style={styles.important}>
        <Text style={styles.clauseTitle}>ĐIỀU 8 — HÀNG VÔ THỪA NHẬN</Text>
        <Text style={styles.body}>
          {/* Hạn chọn cuối kỳ do Admin cấu hình (end_of_term_decision_days), biên nhận chưa lưu số này → không ghi số */}
          Hết {days} ngày, bạn chọn nhận lại hàng hoặc ký gửi lại{" "}
          <Text style={styles.bold}>trước hạn ReHome thông báo</Text> trên ứng
          dụng. Quá hạn mà không phản hồi, hàng được xem là vô thừa nhận:{" "}
          <Text style={styles.bold}>bạn mất quyền sở hữu</Text>.
        </Text>
      </View>
      {otherClauses(receipt)
        .filter((c) => c.no > 8)
        .map((c) => (
          <FoldClause key={c.no} clause={c} />
        ))}
    </>
  );
}

// Một điều khoản bấm để mở / đóng (Điều 4–7, 9, 10) — vẫn nằm đúng vị trí số thứ tự
function FoldClause({ clause }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.clause}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.clauseTitle, styles.flex]}>{clause.title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      {open ? <Text style={styles.body}>{clause.body}</Text> : null}
    </View>
  );
}

// Bản đã xác nhận: gói toàn bộ Điều 1 → 10 trong một mục bấm để xem
function FullTerms({ receipt }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.clause}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.clauseTitle, styles.flex]}>
          TOÀN VĂN ĐIỀU KHOẢN
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      {open ? <ReceiptClauses receipt={receipt} /> : null}
    </View>
  );
}

function ReceiptHeading({ receipt }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.docTitle}>BIÊN NHẬN KÝ GỬI HÀNG HOÁ</Text>
      <Text style={styles.muted}>
        Số {receipt.receiptNo} · {fmtDate(receipt.createdAt)}
      </Text>
      {receipt.warehouseName ? (
        <Text style={styles.muted}>{receipt.warehouseName} — ReHome</Text>
      ) : null}
    </View>
  );
}

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.receipt(id),
    queryFn: () => consignmentApi.getReceipt(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Biên nhận ký gửi" onBack={goBack} />;

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
            icon="document-outline"
            title="Không tìm thấy biên nhận"
            description="Biên nhận không tồn tại hoặc bạn không có quyền xem."
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

  // Đã huỷ phải xét TRƯỚC confirmedAt: bản bị huỷ là bản đã xác nhận
  if (isVoided(query.data))
    return <VoidedReceipt receipt={query.data} header={header} />;
  return query.data.confirmedAt ? (
    <ConfirmedReceipt receipt={query.data} header={header} />
  ) : (
    <PendingReceipt receipt={query.data} header={header} />
  );
}

// Biên nhận đã bị Moderator huỷ (đã xác nhận nhưng chưa nhập kho, lead chốt 18/11): không còn hiệu lực,
// giữ để đối chiếu. ReHome lập bản mới (giữ nguyên mức phí) → Member xác nhận lại bản mới
function VoidedReceipt({ receipt, header }) {
  const nextId = receipt.replacedByReceiptId;
  return (
    <Screen
      header={header}
      padded={false}
      footer={
        nextId ? (
          <Button
            title="Xem biên nhận mới"
            onPress={() => router.replace(`/receipts/${nextId}`)}
          />
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.voided}>
          <View style={styles.voidedHead}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={styles.voidedTitle}>Biên nhận đã bị huỷ</Text>
          </View>
          {receipt.voidedAt ? (
            <Text style={styles.body}>Huỷ lúc {fmtTime(receipt.voidedAt)}</Text>
          ) : null}
          {receipt.voidReason ? (
            <Text style={styles.body}>
              Lý do: <Text style={styles.bold}>{receipt.voidReason}</Text>
            </Text>
          ) : null}
          <Text style={styles.body}>
            {nextId
              ? "ReHome đã lập biên nhận mới thay cho bản này. Mở biên nhận mới để xem và xác nhận lại."
              : "ReHome sẽ lập biên nhận mới thay cho bản này, các mức phí giữ nguyên. Bạn sẽ nhận được thông báo để xác nhận lại."}
          </Text>
        </View>

        <ReceiptHeading receipt={receipt} />
        <FullTerms receipt={receipt} />

        <Text style={styles.small}>
          Biên nhận này không còn hiệu lực, chỉ được lưu lại để đối chiếu.
        </Text>
      </ScrollView>
    </Screen>
  );
}

// KG-06 Chờ xác nhận + KG-07
function PendingReceipt({ receipt, header }) {
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Moderator vừa sửa (bản mới tải về) → bỏ tick "đã đọc và đồng ý", bắt đọc lại
  useEffect(() => {
    setAgreed(false);
  }, [receipt.version, receipt.agreedPrice, receipt.conditionNote]);

  const confirm = useMutation({
    // gửi kèm version đang xem → BE chặn nếu vừa bị sửa (RECEIPT_CHANGED)
    mutationFn: () => consignmentApi.confirmReceipt(receipt.id, receipt.version),
    onSuccess: (data) => {
      // Cập nhật ngay màn này sang "Đã xác nhận", và làm mới form + sản phẩm
      queryClient.setQueryData(consignKeys.receipt(receipt.id), (old) => ({
        ...old,
        ...data,
      }));
      queryClient.invalidateQueries({ queryKey: ["consign", "forms"] });
      queryClient.invalidateQueries({ queryKey: ["consign", "form"] });
      queryClient.invalidateQueries({ queryKey: ["consign", "products"] });
      setShowConfirm(false);
      showToast("Đã xác nhận biên nhận");
    },
    onError: (e) => {
      setShowConfirm(false);
      // Moderator vừa sửa biên nhận lúc bạn đang xem → tải bản mới, bắt đọc lại (không xác nhận nhầm bản cũ)
      if (e.code === ERROR_CODES.RECEIPT_CHANGED) {
        queryClient.invalidateQueries({
          queryKey: consignKeys.receipt(receipt.id),
        });
        return Alert.alert(
          "Biên nhận vừa được cập nhật",
          "ReHome vừa sửa biên nhận này. Bạn xem lại nội dung mới rồi xác nhận nhé.",
        );
      }
      if (e.status === 409) {
        // Đã xác nhận ở nơi khác → tải lại để hiện bản Đã xác nhận
        queryClient.invalidateQueries({
          queryKey: consignKeys.receipt(receipt.id),
        });
        return showToast("Biên nhận đã được xác nhận trước đó");
      }
      Alert.alert("Chưa xác nhận được", e.message);
    },
  });

  const onPressConfirm = () => {
    if (!agreed)
      return setAgreeError("Bạn cần đọc và đồng ý nội dung biên nhận");
    setShowConfirm(true);
  };

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        <View style={styles.footerCol}>
          <Checkbox
            checked={agreed}
            onChange={(v) => {
              setAgreed(v);
              setAgreeError(null);
            }}
            error={agreeError}
          >
            Tôi đã đọc và đồng ý toàn bộ nội dung biên nhận
          </Checkbox>
          <Button title="Xác nhận biên nhận" onPress={onPressConfirm} />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Đọc kỹ trước khi xác nhận. Bấm xác nhận là hàng được đăng bán ngay.
          </Text>
        </View>
        <ReceiptHeading receipt={receipt} />
        {receipt.editedAt ? (
          <NoteBox>
            {`ReHome đã cập nhật biên nhận lúc ${fmtTime(receipt.editedAt)}${
              receipt.editReason ? `. Lý do: ${receipt.editReason}` : ""
            }. Bạn kiểm tra lại giá và ghi chú trước khi xác nhận.`}
          </NoteBox>
        ) : null}
        {receipt.previousReceiptId ? (
          <NoteBox>
            Biên nhận này thay cho biên nhận đã huỷ trước đó, các mức phí giữ
            nguyên như bản cũ.{" "}
            <Text
              style={styles.link}
              accessibilityRole="link"
              onPress={() =>
                router.push(`/receipts/${receipt.previousReceiptId}`)
              }
            >
              Xem bản đã huỷ
            </Text>
          </NoteBox>
        ) : null}
        {receipt.previousPrice ? (
          <NoteBox>
            {`Ký gửi lại: ReHome đề xuất ${formatVnd(receipt.agreedPrice)} (giá cuối kỳ trước ${formatVnd(
              receipt.previousPrice,
            )}).${receipt.moderatorNote ? ` Ghi chú ReHome: ${receipt.moderatorNote}` : ""}`}
          </NoteBox>
        ) : null}

        <ReceiptClauses receipt={receipt} />
      </ScrollView>

      <ReceiptConfirmModal
        visible={showConfirm}
        receipt={receipt}
        loading={confirm.isPending}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => confirm.mutate()}
      />
    </Screen>
  );
}

// KG-06 Đã xác nhận
function ConfirmedReceipt({ receipt, header }) {
  const memberCode = useAuthStore((s) => s.user?.memberCode);
  const rates = commissionRates(receipt);
  const endDate = dayjs(receipt.confirmedAt).add(totalTermDays(receipt), "day");
  const [downloading, setDownloading] = useState(false);

  // PDF cần token (BE trả file, không trả link) → tải về máy rồi mở bảng chia sẻ của hệ điều hành:
  // xem trước, lưu vào Tệp, gửi Zalo… gộp 1 nút (link công khai không còn nên bỏ chia sẻ dạng chữ)
  const openPdf = async () => {
    if (receipt.pdfAvailable === false)
      return showToast("Bản PDF đang được tạo, thử lại sau ít phút");
    setDownloading(true);
    try {
      const file = await consignmentApi.downloadReceiptPdf(receipt);
      if (!(await Sharing.isAvailableAsync()))
        return showToast("Máy không hỗ trợ mở file PDF");
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: `Biên nhận ${receipt.receiptNo}`,
      });
    } catch {
      Alert.alert("Không tải được PDF", "Kiểm tra mạng rồi thử lại.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        <Button
          title="Lưu / chia sẻ bản PDF"
          loading={downloading}
          onPress={openPdf}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.confirmedRow}>
          <Text style={[styles.muted, styles.left, styles.flex]}>
            Xác nhận lúc {dayjs(receipt.confirmedAt).format("HH:mm DD/MM/YYYY")}
            {memberCode ? `\ntrên tài khoản ${memberCode}` : ""}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ĐÃ XÁC NHẬN</Text>
          </View>
        </View>

        <ReceiptHeading receipt={receipt} />

        <KeyValueTable
          rows={[
            { label: "Sản phẩm", value: productLine(receipt) },
            { label: "Giá bán", value: formatVnd(receipt.agreedPrice) },
            { label: "Giá sàn", value: formatVnd(receipt.floorPrice) },
            { label: "Hoa hồng", value: rates.map(formatRate).join(" → ") },
            { label: "Hết hạn", value: endDate.format("DD/MM/YYYY") },
          ]}
        />

        <NoteBox>
          Các mức phí và thời hạn trong biên nhận này được giữ nguyên đến khi
          kết thúc. ReHome đổi cấu hình sau này không ảnh hưởng hợp đồng của
          bạn.
        </NoteBox>

        <FullTerms receipt={receipt} />

        <Text style={styles.small}>
          Biên nhận này không có chữ ký tay. Giá trị xác nhận dựa trên thao tác
          bấm xác nhận trên tài khoản đã đăng nhập, cùng thời điểm được hệ thống
          ghi nhận và lưu trong nhật ký.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  banner: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  bannerText: { ...textStyles.body, color: colors.text },
  heading: { alignItems: "center", gap: 2 },
  docTitle: { ...textStyles.heading, color: colors.text, textAlign: "center" },
  muted: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  clause: { gap: spacing.sm },
  clauseTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  prices: { flexDirection: "row", gap: spacing.md },
  priceBox: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  priceLabel: { ...textStyles.caption, color: colors.textSecondary },
  priceValue: { ...textStyles.title, color: colors.primary },
  termTable: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  termRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  termHead: { backgroundColor: colors.background },
  termHeadText: { fontFamily: fonts.semibold },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  termCell: { width: 56, ...textStyles.body, color: colors.text },
  termCellWide: { flex: 1, ...textStyles.body, color: colors.text },
  termCellRight: {
    width: 80,
    textAlign: "right",
    ...textStyles.body,
    color: colors.text,
  },
  important: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  toggle: { flexDirection: "row", alignItems: "center", minHeight: 40 },
  footerCol: { gap: spacing.md },
  confirmedRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.input / 2,
    backgroundColor: colors.primary,
  },
  badgeText: {
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  small: { ...textStyles.caption, color: colors.textSecondary },
  left: { textAlign: "left" },
  link: { fontFamily: fonts.semibold, color: colors.primary },
  voided: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  voidedHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  voidedTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
