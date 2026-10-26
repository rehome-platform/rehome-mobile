import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { MOCK } from "@/config/env";
import { formatVnd } from "@/utils/money";
import { getProductView, productTiming } from "@/utils/consignment";
import { PRODUCT_VIEW } from "@/constants/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { KeyValueTable } from "@/features/consignment/components/KeyValueTable";
import { ProductBadge } from "@/features/consignment/components/ProductBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");

export default function ReconsignScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated",
  });

  // [CHỈ MOCK] giả lập Moderator đề xuất giá để demo trọn luồng khi chưa có web
  const propose = useMutation({
    mutationFn: () => consignmentApi.mockProposeNewPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignKeys.product(id) });
      queryClient.invalidateQueries({ queryKey: consignKeys.products() });
    },
  });

  if (status !== "authenticated") return <Redirect href="/login" />;
  const header = <AppHeader title="Ký gửi lại" onBack={goBack} />;

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
  if (getProductView(product) !== PRODUCT_VIEW.REPRICING) {
    // Đã xác nhận biên nhận mới → hàng lên sàn lại
    return (
      <Screen header={header}>
        <EmptyState
          icon="pricetag-outline"
          title="Sản phẩm đã lên sàn lại"
          description="Ký gửi lại đã hoàn tất."
        >
          <Button
            title="Xem sản phẩm"
            onPress={() => router.replace(`/my-products/${product.id}`)}
          />
        </EmptyState>
      </Screen>
    );
  }

  const decision = product.endOfTermDecision;
  const hasProposal = !!decision.newReceiptId;
  const steps = [
    {
      title: "Bạn chọn ký gửi lại",
      desc: decision.decidedAt
        ? dayjs(decision.decidedAt).format("HH:mm DD/MM/YYYY")
        : undefined,
      state: "done",
    },
    hasProposal
      ? { title: "Moderator đã đề xuất giá mới", state: "done" }
      : {
          title: "Moderator đề xuất giá mới",
          desc: "Đang xem lại tình trạng món hàng",
          state: "active",
        },
    hasProposal
      ? {
          title: "Bạn xem và xác nhận biên nhận mới",
          desc: "Đang chờ bạn",
          state: "active",
        }
      : { title: "Bạn xem và xác nhận biên nhận mới", state: "todo" },
    { title: "Biên nhận mới, hàng lên sàn lại", state: "todo" },
  ];

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        hasProposal ? (
          <Button
            title="Xem biên nhận mới"
            onPress={() => router.push(`/receipts/${decision.newReceiptId}`)}
          />
        ) : null
      }
    >
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
          <Text style={[styles.muted, styles.flex]}>
            {product.name} · {product.id}
          </Text>
          <ProductBadge product={product} />
        </View>

        <Text style={styles.sectionTitle}>TIẾN TRÌNH</Text>
        <StatusTimeline steps={steps} />

        {hasProposal ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>ReHome đã đề xuất giá mới</Text>
            <Text style={styles.body}>
              Xem biên nhận mới: đồng ý thì xác nhận, hàng lên sàn lại ngay.
            </Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>Đang chờ ReHome phản hồi</Text>
            <Text style={styles.body}>
              Moderator {product.warehouseName} sẽ kiểm tra lại tình trạng món
              hàng và đề xuất mức giá phù hợp hơn. Thường trong{" "}
              <Text style={styles.bold}>1–2 ngày làm việc</Text>.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>KỲ KÝ GỬI VỪA KẾT THÚC</Text>
        <KeyValueTable
          rows={[
            {
              label: "Giá chốt ban đầu",
              value: formatVnd(product.agreedPrice),
            },
            { label: "Giá cuối cùng", value: formatVnd(product.currentPrice) },
            {
              label: "Thời gian trên sàn",
              value: `${productTiming(product).totalDays} ngày, không bán được`,
            },
          ]}
        />

        <NoteBox>
          Hàng vẫn đang giữ tại địa điểm ký gửi, chưa đăng bán. Khi ReHome đề xuất giá, bạn xem
          và xác nhận biên nhận mới để hàng lên sàn lại.
        </NoteBox>

        {__DEV__ && MOCK.consignment && !hasProposal ? (
          <Button
            title="[Dev] Giả lập ReHome đề xuất giá"
            variant="text"
            onPress={() => propose.mutate()}
            loading={propose.isPending}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  muted: { ...textStyles.body, color: colors.textSecondary },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  infoBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  boxTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
