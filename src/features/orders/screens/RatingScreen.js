import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { ORDER_STATUS as S, RATING_LABEL } from "@/constants/order";
import { ordersApi } from "../api/ordersApi";
import { useOrder, useOrderMutation } from "../hooks/useOrders";
import { toDate } from "../utils/time";
import { StarRating } from "../components/StarRating";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/orders");

// BR-14 · Đánh giá dịch vụ kho. Chỉ số sao (PHASE4_GUIDE 0.4 #4). Đã đánh giá → chỉ đọc
export default function RatingScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useOrder(id);
  const rate = useOrderMutation((stars) => ordersApi.rateOrder(id, stars));
  const [stars, setStars] = useState(0);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Đánh giá dịch vụ" onBack={goBack} />;
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

  const order = query.data;
  if (order.status !== S.COMPLETED) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="star-outline"
          title="Chưa đánh giá được"
          description="Bạn đánh giá được sau khi đơn hoàn thành (xác nhận đã nhận hàng, hoặc hệ thống tự hoàn thành)."
        >
          <Button title="Về chi tiết đơn" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  const rated = order.serviceRating != null;
  const shown = rated ? order.serviceRating : stars;
  const first = order.items[0];

  const submit = () =>
    rate.mutate(stars, {
      onSuccess: () => {
        showToast("Cảm ơn bạn đã đánh giá");
        goBack();
      },
      onError: (e) => showToast(e.message), // 409 chưa hoàn thành / đã đánh giá → màn tự tải lại
    });

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        rated ? (
          <Button
            title="Về chi tiết đơn"
            variant="secondary"
            onPress={goBack}
          />
        ) : (
          <Button
            title="Gửi đánh giá"
            disabled={!stars}
            loading={rate.isPending}
            onPress={submit}
          />
        )
      }
    >
      <NoteBox>
        <Text style={styles.noteText}>
          Bạn đang chấm{" "}
          <Text style={styles.strong}>dịch vụ của {order.warehouseName}</Text> —
          đóng gói và giao hàng. Không phải chấm người ký gửi.
        </Text>
      </NoteBox>

      <View style={styles.itemCard}>
        <Text style={styles.strong} numberOfLines={2}>
          {first?.name}
          {order.items.length > 1
            ? ` và ${order.items.length - 1} món khác`
            : ""}
        </Text>
        <Text style={styles.muted}>
          {order.orderNo}
          {order.completedAt
            ? ` · hoàn thành ${toDate(order.completedAt).format("DD/MM/YYYY")}`
            : ""}
        </Text>
      </View>

      <View style={styles.starsBlock}>
        <StarRating
          value={shown}
          onChange={rated ? undefined : setStars}
          size={44}
        />
        <Text style={styles.starsText}>
          {shown
            ? `${shown} / 5 · ${RATING_LABEL[shown]}`
            : "Chạm vào sao để chấm"}
        </Text>
        {rated && order.ratedAt ? (
          <Text style={styles.muted}>
            Đánh giá lúc {toDate(order.ratedAt).format("HH:mm DD/MM/YYYY")}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.xl },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  itemCard: {
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  starsBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  starsText: { ...textStyles.heading, color: colors.text },
});
