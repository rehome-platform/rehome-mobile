import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { ERROR_CODES } from "@/constants/errorCodes";
import { MAX_REDEEM_QUANTITY, POINT_REDEEM_TYPE } from "@/constants/points";
import { useAuthStore } from "@/stores/authStore";
import { formatNumber, formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { pointsKeys } from "../api/queryKeys";
import { usePoints, useRedeemPoints } from "../hooks/usePoints";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// Hai loại đổi điểm. Đơn giá (cost) và số lượt đang có (credits) lấy từ response GET /points
const REDEEM_OPTIONS = [
  {
    type: POINT_REDEEM_TYPE.AI_TRYON,
    title: "Phối đồ AI",
    desc: "Ảnh phối đồ tạo bằng AI",
    costKey: "costPerAiTryon",
    creditsKey: "bonusAiTryonCredits",
  },
  {
    type: POINT_REDEEM_TYPE.LIVE_TRYON,
    title: "Thử đồ AI real-time",
    desc: "Thử đồ trực tiếp qua camera",
    costKey: "costPerLiveTryon",
    creditsKey: "bonusLiveTryonCredits",
  },
];

// Số lượt tối đa đổi được lúc này: không quá 100 (BE) và không quá số điểm đang có
const maxQuantity = (balance, unitCost) =>
  unitCost > 0
    ? Math.min(MAX_REDEEM_QUANTITY, Math.floor(balance / unitCost))
    : 0;

function EarnRule({ vndPerPoint }) {
  return (
    <Text style={styles.sub}>
      {vndPerPoint > 0
        ? `Mỗi ${formatVnd(vndPerPoint)} của đơn hàng (sau khi trừ voucher) bạn nhận 1 điểm.`
        : "Tích điểm khi mua hàng đang tạm tắt."}
    </Text>
  );
}

// Một dòng đổi điểm: chọn số lượt (− n +) rồi bấm Đổi → hỏi xác nhận → POST /points/redeem
function RedeemRow({ option, summary, fromTryon }) {
  const redeem = useRedeemPoints();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const unitCost = summary[option.costKey];
  const credits = summary[option.creditsKey];
  const balance = summary.pointsBalance;
  const closed = unitCost <= 0; // Admin đặt đơn giá 0 = đóng quy đổi
  const max = maxQuantity(balance, unitCost);
  const qty = Math.min(Math.max(quantity, 1), Math.max(max, 1)); // điểm giảm sau khi đổi thì kéo số lượt xuống theo
  const total = unitCost * qty;
  const canRedeem = !closed && max >= 1;

  const doRedeem = () => {
    setErrorMessage("");
    redeem.mutate(
      { type: option.type, quantity: qty },
      {
        onSuccess: () => {
          setQuantity(1);
          showToast(`Đã đổi ${qty} lượt ${option.title.toLowerCase()}`);
          // Mở từ màn thử đồ (hết lượt) → đổi xong quay về để thử tiếp
          if (fromTryon) goBack();
        },
        onError: (e) => {
          setErrorMessage(e.message);
          // Số điểm trên màn đã cũ (đổi ở máy khác, Admin vừa đổi đơn giá…) → tải lại cho khớp
          if (
            e.code === ERROR_CODES.POINTS_NOT_ENOUGH ||
            e.code === ERROR_CODES.POINTS_REDEEM_UNAVAILABLE
          ) {
            queryClient.invalidateQueries({ queryKey: pointsKeys.summary });
          }
        },
      },
    );
  };

  const confirm = () =>
    Alert.alert(
      "Đổi điểm",
      `Dùng ${formatNumber(total)} điểm để đổi ${qty} lượt ${option.title.toLowerCase()}?`,
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Đổi", onPress: doRedeem },
      ],
    );

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{option.title}</Text>
          <Text style={styles.sub}>{option.desc}</Text>
        </View>
        <Text style={styles.cost}>
          {closed ? "Tạm đóng" : `${formatNumber(unitCost)} điểm/lượt`}
        </Text>
      </View>

      <Text style={styles.sub}>
        Bạn đang có {formatNumber(credits)} lượt đã đổi
      </Text>

      {closed ? (
        <Text style={styles.sub}>
          Quy đổi loại này đang tạm đóng, bạn quay lại sau nhé.
        </Text>
      ) : (
        <View style={styles.action}>
          <View style={styles.qtyBox}>
            <QtyButton
              icon="remove"
              label="Giảm số lượt"
              disabled={qty <= 1 || redeem.isPending}
              onPress={() => setQuantity(qty - 1)}
            />
            <Text style={styles.qty}>{qty}</Text>
            <QtyButton
              icon="add"
              label="Tăng số lượt"
              disabled={qty >= max || redeem.isPending}
              onPress={() => setQuantity(qty + 1)}
            />
          </View>
          <Button
            title={canRedeem ? `Đổi (${formatNumber(total)} điểm)` : "Chưa đủ điểm"}
            disabled={!canRedeem}
            loading={redeem.isPending}
            onPress={confirm}
            style={styles.flex}
          />
        </View>
      )}

      <ErrorBox message={errorMessage} />
    </View>
  );
}

function QtyButton({ icon, label, disabled, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.qtyBtn,
        disabled && styles.qtyBtnDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

// Điểm tích lũy: số dư · cách tích · đổi điểm lấy lượt thử đồ AI
export default function PointsScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const { from } = useLocalSearchParams();
  const points = usePoints();

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Điểm tích lũy" onBack={goBack} />;
  if (points.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (points.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={points.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => points.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const p = points.data;

  return (
    <Screen header={header} padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={points.isRefetching}
            onRefresh={() => points.refetch()}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.balance}>
          <Text style={styles.label}>ĐIỂM HIỆN CÓ</Text>
          <Text style={styles.big}>{formatNumber(p.pointsBalance)}</Text>
          <EarnRule vndPerPoint={p.vndPerPoint} />
        </View>

        <Text style={styles.sectionTitle}>Đổi điểm lấy lượt thử đồ AI</Text>
        {REDEEM_OPTIONS.map((option) => (
          <RedeemRow
            key={option.type}
            option={option}
            summary={p}
            fromTryon={from === "tryon"}
          />
        ))}

        <NoteBox>
          Lượt đã đổi chỉ bị trừ khi lượt miễn phí trong ngày theo gói thành
          viên của bạn đã hết, và không hết hạn.
        </NoteBox>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  loading: { marginTop: spacing.xxl },
  content: { padding: spacing.lg, gap: spacing.lg },
  balance: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  label: { ...textStyles.label, color: colors.textSecondary },
  big: {
    ...textStyles.title,
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  sectionTitle: { ...textStyles.heading, color: colors.text },
  row: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  rowHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowTitle: { ...textStyles.heading, color: colors.text },
  cost: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.primary },
  action: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  qtyBtnDisabled: { borderColor: colors.neutral, opacity: 0.5 },
  qty: {
    minWidth: 28,
    textAlign: "center",
    ...textStyles.heading,
    color: colors.text,
  },
});
