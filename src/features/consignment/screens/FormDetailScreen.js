import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { useAuthStore } from "@/stores/authStore";
import { FORM_STATUS } from "@/constants/consignment";
import { formatVnd } from "@/utils/money";
import { daysLeft } from "@/utils/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { StatusBadge } from "@/features/consignment/components/StatusBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmtDate = (d) => dayjs(d).format("DD/MM/YYYY");
const leftText = (n) =>
  n > 0 ? `Còn ${n} ngày` : n === 0 ? "Hạn chót hôm nay" : "Đã quá hạn";

// Tiến trình theo trạng thái (chỉ PENDING / APPROVED có tiến trình)
function buildTimeline(form) {
  const sent = {
    title: "Đã gửi form",
    desc: dayjs(form.createdAt).format("HH:mm DD/MM/YYYY"),
    state: "done",
  };
  if (form.status === FORM_STATUS.PENDING) {
    return [
      sent,
      {
        title: "Kho đang duyệt",
        desc: "Thường trong 1–2 ngày làm việc",
        state: "active",
      },
      { title: "Mang đồ đến kho", state: "todo" },
      { title: "Kiểm định & nhập kho", state: "todo" },
    ];
  }
  if (form.status === FORM_STATUS.APPROVED) {
    const atWarehouse = !!form.receiptId; // đã có biên nhận = đã mang đồ đến, kho đã kiểm định
    return [
      sent,
      { title: "Kho đã duyệt", state: "done" },
      atWarehouse
        ? { title: "Đã mang đồ đến kho", state: "done" }
        : {
            title: "Mang đồ đến kho",
            desc: `Trước ${fmtDate(form.bringInDeadline)}`,
            state: "active",
          },
      {
        title: "Kiểm định & nhập kho",
        desc: atWarehouse ? "Chờ bạn xác nhận biên nhận" : undefined,
        state: atWarehouse ? "active" : "todo",
      },
    ];
  }
  return null;
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Khối "Việc cần làm" đầu màn khi đã duyệt
function ApprovedTodo({ form }) {
  if (form.receiptId) {
    return (
      <View style={styles.todo}>
        <Text style={styles.todoTitle}>Kho đã lập biên nhận</Text>
        <Text style={styles.todoText}>
          Đọc và xác nhận biên nhận để hàng được nhập kho và đăng bán.
        </Text>
      </View>
    );
  }
  const left = daysLeft(form.bringInDeadline);
  return (
    <View style={styles.todo}>
      <Text style={styles.todoTitle}>Việc cần làm</Text>
      <Text style={styles.todoText}>
        Mang đồ đến <Text style={styles.bold}>{form.warehouse?.name}</Text>{" "}
        trước <Text style={styles.bold}>{fmtDate(form.bringInDeadline)}</Text>.
      </Text>
      <Text style={[styles.todoText, left <= 2 && styles.urgent]}>
        {leftText(left)} · Quá hạn thì form tự huỷ.
      </Text>
    </View>
  );
}

// Nút chính ở đáy theo trạng thái
function Footer({ form }) {
  if (form.status === FORM_STATUS.PENDING) {
    // "Huỷ form" ẩn: chưa có API huỷ (guide 0.4 #5)
    return (
      <Button
        title="Sửa form"
        onPress={() => router.push(`/consign-forms/${form.id}/edit`)}
      />
    );
  }
  if (form.status === FORM_STATUS.APPROVED) {
    return (
      <View style={styles.footerCol}>
        {form.receiptId ? (
          <Button
            title="Xem biên nhận"
            onPress={() => router.push(`/receipts/${form.receiptId}`)}
          />
        ) : null}
        <Button
          title="Mã Member của tôi"
          variant={form.receiptId ? "secondary" : "primary"}
          onPress={() => router.push("/profile/member-code")}
        />
      </View>
    );
  }
  // Bị từ chối / hết hạn → tạo form mới, điền sẵn thông tin cũ (làm ở 3d)
  return (
    <Button
      title={
        form.status === FORM_STATUS.REJECTED
          ? "Tạo form mới từ thông tin này"
          : "Tạo form mới"
      }
      onPress={() =>
        router.push({
          pathname: "/consign-forms/new",
          params: { fromFormId: form.id },
        })
      }
    />
  );
}

export default function FormDetailScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.form(id),
    queryFn: () => consignmentApi.getForm(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Chi tiết form" onBack={goBack} />;

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
            title="Không tìm thấy form"
            description="Form không tồn tại hoặc bạn không có quyền xem."
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

  const form = query.data;
  const timeline = buildTimeline(form);
  const thumb = form.photoUrls?.[0];
  const subtitle = [form.categoryName, form.brandName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen header={header} footer={<Footer form={form} />} padded={false}>
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
        <View style={styles.topRow}>
          {/* Mã form dễ đọc chỉ hiện khi BE trả (id là UUID) [CHỜ BE formNo] */}
          <Text style={styles.code}>
            {form.formNo ? `Mã form ${form.formNo}` : "Form ký gửi"}
          </Text>
          <StatusBadge status={form.status} />
        </View>

        {form.status === FORM_STATUS.APPROVED ? (
          <ApprovedTodo form={form} />
        ) : null}

        {form.status === FORM_STATUS.APPROVED && !form.receiptId ? (
          <NoteBox>
            Đến quầy, đọc mã Member hoặc số điện thoại cho nhân viên. Moderator
            sẽ kiểm định và thống nhất giá bán với bạn trước khi nhập kho.
          </NoteBox>
        ) : null}

        {form.status === FORM_STATUS.REJECTED ? (
          <Section title="LÝ DO TỪ CHỐI">
            <View style={styles.reject}>
              <Text style={styles.rejectText}>
                {form.rejectReason || "Kho không ghi lý do."}
              </Text>
            </View>
          </Section>
        ) : null}

        {form.status === FORM_STATUS.EXPIRED ? (
          <NoteBox>
            {`Form đã hết hạn vì quá hạn mang đồ đến kho (${fmtDate(form.bringInDeadline)}). Bạn có thể tạo form mới.`}
          </NoteBox>
        ) : null}

        {timeline ? (
          <Section title="TIẾN TRÌNH">
            <StatusTimeline steps={timeline} />
          </Section>
        ) : null}

        <Section title="SẢN PHẨM">
          <View style={styles.product}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.thumb} />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{form.productName}</Text>
              {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
              <Text style={styles.price}>
                Giá mong muốn {formatVnd(form.desiredPrice)}
              </Text>
            </View>
          </View>
          {form.description ? (
            <Text style={styles.desc}>{form.description}</Text>
          ) : null}
        </Section>

        {form.warehouse ? (
          <Section title="KHO TIẾP NHẬN">
            <Text style={styles.whName}>{form.warehouse.name}</Text>
            <Text style={styles.muted}>{form.warehouse.address}</Text>
            {form.warehouse.openingHours ? (
              <Text style={styles.muted}>
                Mở cửa {form.warehouse.openingHours}
              </Text>
            ) : null}
            {form.status === FORM_STATUS.APPROVED ? (
              <Text
                style={styles.link}
                accessibilityRole="link"
                onPress={() =>
                  Linking.openURL(
                    `geo:0,0?q=${encodeURIComponent(form.warehouse.address)}`,
                  )
                }
              >
                Chỉ đường
              </Text>
            ) : null}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  code: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  todo: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  todoTitle: { ...textStyles.heading, color: colors.text },
  todoText: { ...textStyles.body, color: colors.text },
  urgent: { fontFamily: fonts.semibold, color: colors.error },
  bold: { fontFamily: fonts.semibold },
  reject: {
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  rejectText: { ...textStyles.body, color: colors.text },
  product: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  productInfo: { flex: 1, gap: 2 },
  productName: { ...textStyles.heading, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  price: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  desc: { ...textStyles.body, color: colors.text },
  whName: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textDecorationLine: "underline",
  },
  footerCol: { gap: spacing.sm },
});
