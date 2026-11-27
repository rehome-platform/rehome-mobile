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
import { FEATURES } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { refreshActive } from "@/lib/query/refresh";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import { formatAddress, formatPhone } from "@/utils/format";
import {
  INVALID_RETURN_CHOICE as C,
  RETURN_STATUS as R,
  SHIP_BACK_LIMITS,
} from "@/constants/returns";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { useSecondsLeft } from "@/features/orders/hooks/useSecondsLeft";
import { toDate } from "@/features/orders/utils/time";
import { formatTimeLeft } from "@/features/orders/utils/orderRules";
import { returnsApi } from "../api/returnsApi";
import {
  useReturn,
  useReturnMutation,
  useShipBackQuote,
} from "../hooks/useReturns";

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

// Gửi lại: chọn địa chỉ nhận (sổ địa chỉ) + phí GHN tới địa chỉ đó
function ShipBackAddress({ addresses, address, onPick, quote }) {
  if (addresses.isPending)
    return <ActivityIndicator color={colors.primary} />;
  if (!addresses.data?.length)
    return (
      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => router.push("/addresses/new")}
      >
        + Thêm địa chỉ nhận hàng
      </Text>
    );
  return (
    <View style={styles.gapSm}>
      <Text style={styles.caption}>GỬI TỚI</Text>
      {addresses.data.map((a) => {
        const on = a.id === address?.id;
        return (
          <Pressable
            key={a.id}
            onPress={() => onPick(a.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.addr, on && styles.addrOn]}
          >
            <View style={[styles.radioSm, on && styles.radioOn]}>
              {on ? <View style={styles.radioDotSm} /> : null}
            </View>
            <View style={styles.flex}>
              <Text style={styles.strong}>
                {a.recipientName} · {formatPhone(a.phone)}
              </Text>
              <Text style={styles.caption}>{formatAddress(a)}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => router.push("/addresses/new")}
      >
        + Thêm địa chỉ khác
      </Text>
      <View style={styles.feeRow}>
        <Text style={styles.muted}>Phí GHN tới địa chỉ này</Text>
        {quote.isSuccess ? (
          <Text style={styles.strong}>{formatVnd(quote.data.fee)}</Text>
        ) : quote.isError ? (
          <Text
            style={styles.link}
            accessibilityRole="button"
            onPress={() => quote.refetch()}
          >
            Thử lại
          </Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
      {quote.isError ? (
        <Text style={styles.error}>{quote.error.message}</Text>
      ) : null}
      <Text style={styles.caption}>
        Giao không thành công (không nghe máy, sai địa chỉ…) thì không hoàn phí,
        hàng về địa điểm ký gửi để bạn đến lấy.
      </Text>
    </View>
  );
}

// RT-04 · Chọn cách nhận lại hàng trả không hợp lệ (/returns/<id>/pickup-choice):
// đến địa điểm lấy (miễn phí) hoặc ReHome gửi lại qua GHN (người mua trả phí trước — đặc tả 27/11)
export default function PickupChoiceScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useReturn(id);
  const r = query.data;
  const left = useSecondsLeft(
    r?.pickupDeadline ? toDate(r.pickupDeadline).valueOf() : 0,
  );
  const [choice, setChoice] = useState(C.WAREHOUSE_PICKUP);
  // Gửi lại (đặc tả 27/11): địa chỉ nhận chọn trong sổ địa chỉ — mặc định địa chỉ mặc định của người mua
  const addresses = useAddresses();
  const [addressId, setAddressId] = useState(null);
  const address =
    addresses.data?.find((a) => a.id === addressId) ?? addresses.data?.[0];
  const shipBack = FEATURES.returnShipBack && choice === C.SHIP_BACK;
  const quote = useShipBackQuote(r, address, shipBack);
  const choose = useReturnMutation((c) =>
    returnsApi.chooseInvalidReturn(id, c, { ret: r, address }),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(`/returns/${id}`);
  const header = <AppHeader title="Nhận lại hàng" onBack={goBack} />;

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

  const fee = quote.data?.fee;

  // Gửi lại: chốt phí theo địa chỉ → sang màn trả phí (hạn 30 phút)
  const confirmShipBack = () =>
    Alert.alert(
      "ReHome gửi lại cho bạn?",
      `Phí GHN ${formatVnd(fee)}, trả trong ${SHIP_BACK_LIMITS.FEE_DEADLINE_MINUTES} phút tới bằng Ví ReHome hoặc VNPay. Giao không thành công thì không hoàn phí, hàng về ${r.warehouseName ?? "địa điểm ký gửi"} để bạn đến lấy.`,
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () =>
            choose.mutate(C.SHIP_BACK, {
              onSuccess: () => router.replace(`/returns/${id}/ship-back-pay`),
              onError: (e) => {
                showToast(e.message);
                query.refetch();
              },
            }),
        },
      ],
    );

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

  const footer = expired ? null : shipBack ? (
    <Button
      title={fee != null ? `Xác nhận & trả phí ${formatVnd(fee)}` : "Xác nhận gửi lại"}
      loading={choose.isPending}
      disabled={!address || fee == null}
      onPress={confirmShipBack}
    />
  ) : (
    <Button
      title="Xác nhận đến địa điểm lấy"
      loading={choose.isPending}
      onPress={confirm}
    />
  );

  return (
    <Screen onRefresh={refreshActive}
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
            <Text style={styles.heading}>Cách nhận lại hàng</Text>
            <Text style={styles.muted}>
              Món này vẫn là của bạn. ReHome giữ hộ tới {fmt(r.pickupDeadline)}.
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

          {/* Đặc tả 27/11: ReHome gửi lại qua GHN, người mua trả phí trước. Tắt bằng FEATURES.returnShipBack */}
          {FEATURES.returnShipBack ? (
            <OptionCard
              title="ReHome gửi lại cho bạn"
              desc={`Gửi qua GHN tới địa chỉ bạn chọn. Bạn trả phí ship trước, ReHome gửi trong ${SHIP_BACK_LIMITS.SHIP_WITHIN_DAYS} ngày.`}
              tag={shipBack && fee != null ? formatVnd(fee) : null}
              selected={choice === C.SHIP_BACK}
              onPress={() => setChoice(C.SHIP_BACK)}
            >
              {shipBack ? (
                <ShipBackAddress
                  addresses={addresses}
                  address={address}
                  onPick={setAddressId}
                  quote={quote}
                />
              ) : null}
            </OptionCard>
          ) : null}

          <View style={styles.warn}>
            <Text style={styles.strong}>
              Nếu tới {fmt(r.pickupDeadline)} mà bạn không chọn
            </Text>
            <Text style={styles.text}>
              Món thành <Text style={styles.strong}>hàng vô chủ</Text> và ReHome
              xử lý theo quy định. Bạn mất quyền với món này.
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
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  boxTitle: { ...textStyles.heading, color: colors.text },
  addr: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  addrOn: { borderColor: colors.primary },
  radioSm: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDotSm: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  error: { ...textStyles.caption, color: colors.error },
  warn: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
});
