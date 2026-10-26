import { useState } from "react";
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
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import {
  INVALID_RETURN_CHOICE as C,
  RETURN_STATUS as R,
} from "@/constants/returns";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { useSecondsLeft } from "@/features/orders/hooks/useSecondsLeft";
import { toDate } from "@/features/orders/utils/time";
import { formatTimeLeft } from "@/features/orders/utils/orderRules";
import { returnsApi } from "../api/returnsApi";
import { useReturn, useReturnMutation } from "../hooks/useReturns";

const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");

// Thẻ lựa chọn có nút tròn + khối thông tin bên trong. disabled → mờ, có nhãn
function OptionCard({
  title,
  desc,
  selected,
  disabled,
  tag,
  onPress,
  children,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionHead}>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <Text style={[styles.optionTitle, styles.flex]}>{title}</Text>
        {tag ? <Text style={styles.tag}>{tag}</Text> : null}
      </View>
      <Text style={styles.muted}>{desc}</Text>
      {children ? <View style={styles.inner}>{children}</View> : null}
    </Pressable>
  );
}

// RT-04 · Chọn cách nhận lại hàng trả không hợp lệ (/returns/<id>/pickup-choice)
export default function PickupChoiceScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useReturn(id);
  const r = query.data;
  const left = useSecondsLeft(
    r?.pickupDeadline ? toDate(r.pickupDeadline).valueOf() : 0,
  );
  const [choice, setChoice] = useState(C.WAREHOUSE_PICKUP); // chỉ lựa chọn này dùng được (0.4 #8)
  const choose = useReturnMutation((c) =>
    returnsApi.chooseInvalidReturn(id, c),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(`/returns/${id}`);
  const header = <AppHeader title="Nhận lại hàng" onBack={goBack} />;

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

  // Không còn ở bước chọn (đã chọn / trạng thái khác) → về RT-02
  if (r.status !== R.INVALID || r.invalidReturnChoice)
    return <Redirect href={`/returns/${id}`} />;

  const expired = left === 0;
  const first = r.items[0];

  const confirm = () =>
    Alert.alert(
      "Đến địa điểm lấy lại hàng?",
      `Bạn cần đến ${r.warehouseName ?? "địa điểm ký gửi"} trước ${fmt(r.pickupDeadline)} và đọc mã Member tại quầy.`,
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () =>
            choose.mutate(choice, {
              onSuccess: () => {
                showToast("Đã ghi nhận, hẹn bạn ở địa điểm ký gửi");
                goBack();
              },
              onError: (e) => {
                showToast(e.message);
                query.refetch();
              },
            }),
        },
      ],
    );

  const footer = expired ? null : (
    <Button
      title="Xác nhận đến địa điểm lấy"
      loading={choose.isPending}
      onPress={confirm}
    />
  );

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.banner}>
        <Text style={styles.muted}>
          {[r.code, "không hợp lệ"].filter(Boolean).join(" · ")}
        </Text>
        <Text style={styles.strong}>
          {expired ? "Đã hết hạn" : `Còn ${formatTimeLeft(r.pickupDeadline)}`}
        </Text>
      </View>

      {first ? (
        <View style={styles.itemCard}>
          <OrderItemRow item={first} />
          {r.warehouseName ? (
            <Text style={styles.caption}>Đang ở {r.warehouseName}</Text>
          ) : null}
        </View>
      ) : null}

      {expired ? (
        <View style={[styles.box, styles.boxStrong]}>
          <Text style={styles.boxTitle}>Đã hết hạn chọn cách nhận lại</Text>
          <Text style={styles.text}>
            Hết hạn {fmt(r.pickupDeadline)} mà chưa chọn: món thành hàng vô chủ
            và ReHome xử lý theo quy định.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.gapSm}>
            <Text style={styles.heading}>Bạn muốn nhận lại bằng cách nào?</Text>
            <Text style={styles.muted}>
              Món này vẫn là của bạn. ReHome không giữ hộ quá 7 ngày.
            </Text>
          </View>

          <OptionCard
            title="Đến địa điểm lấy"
            desc="Miễn phí. Mang mã Member tới quầy để nhận lại hàng."
            selected={choice === C.WAREHOUSE_PICKUP}
            onPress={() => setChoice(C.WAREHOUSE_PICKUP)}
          >
            <Text style={styles.strong}>{r.warehouseName}</Text>
            {r.warehouseAddress ? (
              <Text style={styles.muted}>{r.warehouseAddress}</Text>
            ) : null}
            {r.warehouseOpeningHours ? (
              <Text style={styles.caption}>
                Mở cửa {r.warehouseOpeningHours}
              </Text>
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
          </OptionCard>

          {/* [CHỜ BE câu 9 + LEAD] chưa có API trả phí gửi lại → mờ (0.4 #8) */}
          <OptionCard
            title="ReHome gửi lại cho bạn"
            desc="Giao về địa chỉ cũ trong 2–3 ngày. Bạn trả phí vận chuyển."
            tag="Sắp có"
            disabled
          >
            <View style={styles.feeRow}>
              <Text style={styles.muted}>Phí gửi lại</Text>
              <Text style={styles.strong}>
                {r.shipBackFee != null ? formatVnd(r.shipBackFee) : "—"}
              </Text>
            </View>
          </OptionCard>

          <View style={styles.warn}>
            <Text style={styles.strong}>Nếu hết 7 ngày mà bạn không chọn</Text>
            <Text style={styles.text}>
              Món thành <Text style={styles.strong}>hàng vô chủ</Text> và ReHome xử
              lý theo quy định. Bạn mất quyền với món này.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  gapSm: { gap: spacing.xs },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  itemCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  heading: { ...textStyles.heading, color: colors.text },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  option: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary },
  optionDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
    ...textStyles.label,
    color: colors.text,
    backgroundColor: colors.secondary,
  },
  inner: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between" },
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: { borderWidth: 2, borderColor: colors.text },
  boxTitle: { ...textStyles.heading, color: colors.text },
  warn: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
});
