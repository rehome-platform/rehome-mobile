import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { FEATURES, MOCK } from "@/config/env";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import {
  counterRoundsLeft,
  formatRate,
  getProductView,
  productTiming,
  reconsignStatusOf,
} from "@/utils/consignment";
import {
  PRODUCT_VIEW,
  RECONSIGN_LIMITS,
  RECONSIGN_RESPONSE,
  RECONSIGN_STATUS as RS,
} from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { KeyValueTable } from "@/features/consignment/components/KeyValueTable";
import { ProductBadge } from "@/features/consignment/components/ProductBadge";
import {
  ReconsignActionModal,
  fmtDeadline,
} from "@/features/consignment/components/ReconsignActionModal";
import { MessageWarehouseButton } from "@/features/chat/components/MessageWarehouseButton";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmtTime = (v) => (v ? dayjs(v).format("HH:mm DD/MM/YYYY") : undefined);

// Phản hồi của ReHome cho giá bạn đề xuất → tiêu đề khung đề xuất hiện tại
const RESPONSE_TITLE = {
  [RECONSIGN_RESPONSE.ACCEPTED]: "ReHome đồng ý giá bạn đề xuất",
  [RECONSIGN_RESPONSE.REPROPOSED]: "ReHome đề xuất một giá khác",
  [RECONSIGN_RESPONSE.KEPT]: "ReHome giữ giá đề xuất",
};
// Lịch sử thương lượng (BE negotiationHistory[]: actor, action, price, note, createdAt)
const HISTORY_LABEL = {
  PROPOSE: "ReHome đề xuất",
  COUNTER: "Bạn đề xuất",
  ACCEPT: "ReHome đồng ý giá bạn đề xuất",
  REPROPOSE: "ReHome đề xuất giá khác",
  KEEP: "ReHome giữ giá",
  DECLINE: "Bạn không đồng ý",
  CONFIRM: "Bạn xác nhận biên nhận",
  EXPIRE: "Quá hạn xác nhận",
};

// KG-12 · Ký gửi lại cuối kỳ: chờ ReHome đề xuất giá → xem & xác nhận biên nhận mới.
// Thương lượng (đặc tả 27/11, FEATURES.reconsignNegotiation): đề xuất giá khác (tối đa n lần) hoặc
// không đồng ý → nhận lại hàng miễn phí; mỗi đề xuất có hạn xác nhận
export default function ReconsignScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | "counter" | "decline"
  const [actionError, setActionError] = useState(null);
  const query = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated",
  });
  const product = query.data;
  const decision = product?.endOfTermDecision;
  const receiptId = decision?.newReceiptId;
  // Biên nhận ReHome đề xuất → giá, giá sàn, hoa hồng kỳ 1, ghi chú
  const receipt = useQuery({
    queryKey: consignKeys.receipt(receiptId),
    queryFn: () => consignmentApi.getReceipt(receiptId),
    enabled: !!receiptId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: consignKeys.product(id) });
    queryClient.invalidateQueries({ queryKey: consignKeys.products() });
    if (receiptId)
      queryClient.invalidateQueries({ queryKey: consignKeys.receipt(receiptId) });
  };

  // Đề xuất không còn hiệu lực (quá hạn / ReHome vừa đổi) → đóng hộp, tải lại, báo
  const onActionError = (e) => {
    if (
      [
        ERROR_CODES.RE_CONSIGN_PROPOSAL_EXPIRED,
        ERROR_CODES.RE_CONSIGN_NOT_PROPOSED,
        ERROR_CODES.RE_CONSIGN_COUNTER_LIMIT,
      ].includes(e.code)
    ) {
      setMode(null);
      refresh();
      return Alert.alert("Chưa gửi được", e.message);
    }
    setActionError(e.message);
  };

  const counter = useMutation({
    mutationFn: (v) => consignmentApi.counterOfferReConsign(decision.id, v),
    onSuccess: () => {
      setMode(null);
      refresh();
      showToast("Đã gửi đề xuất giá, chờ ReHome phản hồi");
    },
    onError: onActionError,
  });
  const decline = useMutation({
    mutationFn: (v) => consignmentApi.declineReConsign(decision.id, v),
    onSuccess: () => {
      setMode(null);
      refresh();
      showToast("Đã chuyển sang nhận lại hàng");
      router.replace(`/my-products/${id}`);
    },
    onError: onActionError,
  });

  // [CHỈ MOCK] giả lập Moderator đề xuất giá để demo trọn luồng khi chưa có web
  const propose = useMutation({
    mutationFn: () => consignmentApi.mockProposeNewPrice(id),
    onSuccess: refresh,
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

  const view = getProductView(product);
  if (view !== PRODUCT_VIEW.REPRICING) {
    // Không đồng ý / quá hạn xác nhận → BE chuyển sang nhận lại hàng (PICKUP)
    if (view === PRODUCT_VIEW.PICKUP) {
      const expired = decision?.reConsignStatus === RS.EXPIRED;
      return (
        <Screen header={header}>
          <EmptyState
            icon="cube-outline"
            title="Đã chuyển sang nhận lại hàng"
            description={
              expired
                ? "Quá hạn xác nhận biên nhận mới nên món chuyển sang nhận lại hàng miễn phí."
                : "Bạn đã không đồng ý giá ký gửi lại nên món chuyển sang nhận lại hàng miễn phí."
            }
          >
            <Button
              title="Xem cách nhận lại"
              onPress={() => router.replace(`/my-products/${product.id}`)}
            />
          </EmptyState>
        </Screen>
      );
    }
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

  const stage = reconsignStatusOf(product);
  const negotiation = FEATURES.reconsignNegotiation;
  const roundsLeft = counterRoundsLeft(product);
  const proposed = stage === RS.PROPOSED;
  const countered = negotiation && decision.memberCounterPrice != null;
  const r = receipt.data;
  const history = negotiation ? (decision.negotiationHistory ?? []) : [];

  const steps = [
    {
      title: "Bạn chọn ký gửi lại",
      desc: fmtTime(decision.decidedAt),
      state: "done",
    },
    stage === RS.AWAITING_PRICE
      ? {
          title: "ReHome đề xuất giá mới",
          desc: "Đang xem lại tình trạng món hàng",
          state: "active",
        }
      : { title: "ReHome đã đề xuất giá mới", state: "done" },
    ...(countered
      ? [
          {
            title: `Bạn đề xuất ${formatVnd(decision.memberCounterPrice)}`,
            desc: fmtTime(decision.counteredAt),
            state: "done",
          },
          stage === RS.COUNTER_OFFERED
            ? {
                title: "ReHome phản hồi giá bạn đề xuất",
                desc: `Thường trong ${RECONSIGN_LIMITS.MODERATOR_RESPONSE_DAYS} ngày`,
                state: "active",
              }
            : {
                title:
                  RESPONSE_TITLE[decision.moderatorResponse] ??
                  "ReHome đã phản hồi",
                desc: fmtTime(decision.respondedAt),
                state: "done",
              },
        ]
      : []),
    proposed
      ? {
          title: "Bạn xem và xác nhận biên nhận mới",
          desc:
            negotiation && decision.proposalDeadline
              ? `Trước ${fmtDeadline(decision.proposalDeadline)}`
              : "Đang chờ bạn",
          state: "active",
        }
      : { title: "Bạn xem và xác nhận biên nhận mới", state: "todo" },
    { title: "Biên nhận mới, hàng lên sàn lại", state: "todo" },
  ];

  const footer = proposed ? (
    <View style={styles.footerCol}>
      <Button
        title="Xem & xác nhận biên nhận"
        onPress={() => router.push(`/receipts/${decision.newReceiptId}`)}
      />
      {negotiation && roundsLeft > 0 ? (
        <Button
          title={`Đề xuất giá khác (còn ${roundsLeft} lần)`}
          variant="secondary"
          onPress={() => {
            setActionError(null);
            setMode("counter");
          }}
        />
      ) : null}
      {negotiation ? (
        <Button
          title="Không đồng ý, nhận lại hàng"
          variant="text"
          onPress={() => {
            setActionError(null);
            setMode("decline");
          }}
        />
      ) : null}
    </View>
  ) : null;

  return (
    <Screen header={header} padded={false} footer={footer}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              query.refetch();
              if (receiptId) receipt.refetch();
            }}
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

        {stage === RS.AWAITING_PRICE ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>Đang chờ ReHome phản hồi</Text>
            <Text style={styles.body}>
              Moderator {product.warehouseName} sẽ kiểm tra lại tình trạng món
              hàng và đề xuất mức giá phù hợp hơn. Thường trong{" "}
              <Text style={styles.bold}>1–2 ngày làm việc</Text>.
            </Text>
          </View>
        ) : null}

        {stage === RS.COUNTER_OFFERED ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>
              Đang chờ ReHome phản hồi giá bạn đề xuất
            </Text>
            <Text style={styles.body}>
              Bạn đề xuất{" "}
              <Text style={styles.bold}>
                {formatVnd(decision.memberCounterPrice)}
              </Text>
              . ReHome sẽ chấp nhận, đề xuất giá khác hoặc giữ giá trong khoảng{" "}
              {RECONSIGN_LIMITS.MODERATOR_RESPONSE_DAYS} ngày, rồi bạn xác nhận
              biên nhận lần cuối.
            </Text>
            {decision.memberCounterNote ? (
              <Text style={styles.muted}>
                Ghi chú của bạn: {decision.memberCounterNote}
              </Text>
            ) : null}
          </View>
        ) : null}

        {proposed ? (
          <View style={[styles.infoBox, styles.infoStrong]}>
            <Text style={styles.boxTitle}>
              {(negotiation && RESPONSE_TITLE[decision.moderatorResponse]) ||
                "ReHome đã đề xuất giá mới"}
            </Text>
            {negotiation && decision.moderatorResponseNote ? (
              <Text style={styles.body}>
                Ghi chú ReHome: {decision.moderatorResponseNote}
              </Text>
            ) : null}
            {r ? (
              <KeyValueTable
                rows={[
                  { label: "Giá bán đề xuất", value: formatVnd(r.agreedPrice) },
                  { label: "Giá sàn", value: formatVnd(r.floorPrice) },
                  ...(r.commissionRateTerm1 != null
                    ? [
                        {
                          label: "Hoa hồng kỳ 1",
                          value: formatRate(r.commissionRateTerm1),
                        },
                      ]
                    : []),
                ]}
              />
            ) : receipt.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            {r?.moderatorNote && !decision.moderatorResponseNote ? (
              <Text style={styles.muted}>Ghi chú ReHome: {r.moderatorNote}</Text>
            ) : null}
            <Text style={styles.body}>
              {negotiation && decision.proposalDeadline ? (
                <>
                  Xác nhận trước{" "}
                  <Text style={styles.bold}>
                    {fmtDeadline(decision.proposalDeadline)}
                  </Text>
                  . Quá hạn thì món chuyển sang nhận lại hàng miễn phí.
                </>
              ) : (
                "Xem biên nhận mới: đồng ý thì xác nhận, hàng lên sàn lại ngay."
              )}
            </Text>
            {negotiation && roundsLeft === 0 ? (
              <Text style={styles.muted}>
                Bạn đã dùng hết lượt đề xuất giá: chỉ còn xác nhận hoặc không
                đồng ý.
              </Text>
            ) : null}
          </View>
        ) : null}

        {history.length ? (
          <>
            <Text style={styles.sectionTitle}>LỊCH SỬ THƯƠNG LƯỢNG</Text>
            <View style={styles.table}>
              {history.map((h, i) => (
                <View
                  key={`${h.createdAt}-${i}`}
                  style={[styles.historyRow, i > 0 && styles.divider]}
                >
                  <View style={styles.flex}>
                    <Text style={styles.body}>
                      {HISTORY_LABEL[h.action] ?? h.action}
                      {h.price != null ? ` ${formatVnd(h.price)}` : ""}
                    </Text>
                    {h.note ? <Text style={styles.muted}>{h.note}</Text> : null}
                  </View>
                  <Text style={styles.caption}>
                    {dayjs(h.createdAt).format("HH:mm DD/MM")}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

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
          Hàng vẫn đang giữ tại địa điểm ký gửi, chưa đăng bán. Khi ReHome đề
          xuất giá, bạn xem và xác nhận biên nhận mới để hàng lên sàn lại.
        </NoteBox>

        <MessageWarehouseButton
          warehouseId={product.warehouseId}
          warehouseName={product.warehouseName}
          draft={`Cho mình hỏi về giá ký gửi lại món ${product.name} (SKU ${product.id}): `}
          from={`/my-products/${product.id}/reconsign`}
        />

        {__DEV__ && MOCK.consignment && stage === RS.AWAITING_PRICE ? (
          <Button
            title="[Dev] Giả lập ReHome đề xuất giá"
            variant="text"
            onPress={() => propose.mutate()}
            loading={propose.isPending}
          />
        ) : null}
      </ScrollView>

      <ReconsignActionModal
        visible={!!mode}
        mode={mode}
        product={product}
        proposedPrice={r?.agreedPrice}
        roundsLeft={roundsLeft}
        loading={counter.isPending || decline.isPending}
        error={actionError}
        onCancel={() => setMode(null)}
        onSubmit={(v) =>
          mode === "counter" ? counter.mutate(v) : decline.mutate(v)
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  footerCol: { gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  muted: { ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  infoBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  infoStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  boxTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  table: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
});
