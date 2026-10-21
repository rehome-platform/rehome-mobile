import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Redirect,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { RadioCard } from "@/components/ui/RadioCard";
import { TextField } from "@/components/ui/TextField";
import { useAuthStore } from "@/stores/authStore";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import { RETURN_LIMITS, RETURN_REASONS } from "@/constants/returns";
import { ORDER_STATUS } from "@/constants/order";
import { PhotoPicker } from "@/features/consignment/components/PhotoPicker";
import { uploadPhotos } from "@/features/consignment/utils/photos";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useOrder } from "@/features/orders/hooks/useOrders";
import { useSecondsLeft } from "@/features/orders/hooks/useSecondsLeft";
import { OrderItemRow } from "@/features/orders/components/OrderItemRow";
import { toDate } from "@/features/orders/utils/time";
import {
  formatTimeLeft,
  returnDeadlineOf,
} from "@/features/orders/utils/orderRules";
import { returnsApi } from "../api/returnsApi";
import { useReturnMutation } from "../hooks/useReturns";
import { buildReasonText } from "../utils/returnRules";
import { returnSchema } from "../schemas";

const fmt = (v) => (v ? toDate(v).format("DD/MM/YYYY HH:mm") : "");

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// RT-01 Quá hạn: chỉ khối giải thích + mốc thời gian, không nút (PHASE5_GUIDE 0.4 #11)
function ExpiredView({ order, deadline }) {
  const late = dayjs().diff(deadline, "day");
  const rows = [
    ["Giao thành công", toDate(order.deliveredAt).format("DD/MM HH:mm")],
    ["Hết hạn trả hàng", deadline.format("DD/MM HH:mm")],
    [
      "Hôm nay",
      `${dayjs().format("DD/MM")}${late > 0 ? ` · trễ ${late} ngày` : ""}`,
    ],
  ];
  return (
    <>
      <View style={[styles.box, styles.boxStrong]}>
        <Text style={styles.boxTitle}>Đã quá hạn yêu cầu trả hàng</Text>
        <Text style={styles.text}>
          Đơn <Text style={styles.strong}>{order.orderNo}</Text> giao thành công
          ngày {toDate(order.deliveredAt).format("DD/MM/YYYY")}. Cửa sổ trả hàng
          là 3 ngày kể từ lúc giao, đã hết từ{" "}
          <Text style={styles.strong}>{deadline.format("DD/MM")}</Text>.
        </Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.sectionTitle}>MỐC THỜI GIAN ĐƠN NÀY</Text>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.kvRow}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={styles.strong}>{value}</Text>
          </View>
        ))}
      </View>
      <Section title="SẢN PHẨM TRONG ĐƠN">
        <View style={styles.dim}>
          {order.items.map((it, i) => (
            <OrderItemRow key={`${it.productId ?? "x"}-${i}`} item={it} />
          ))}
        </View>
      </Section>
    </>
  );
}

// RT-01 · Gửi yêu cầu trả hàng (/returns/new?orderId=)
export default function ReturnFormScreen() {
  const { orderId } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useOrder(orderId);
  const order = query.data;
  const addresses = useAddresses();
  const deadline = order ? returnDeadlineOf(order) : null;
  const left = useSecondsLeft(deadline ? deadline.valueOf() : 0);
  const [formError, setFormError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: { reasonKey: undefined, detail: "", photos: [] },
  });

  const submit = useReturnMutation(async (values) => {
    const photoUrls = await uploadPhotos(values.photos);
    return returnsApi.createReturn(orderId, {
      reason: buildReasonText(values.reasonKey, values.detail),
      photoUrls,
    });
  });

  const leave = () =>
    router.canGoBack() ? router.back() : router.replace(`/orders/${orderId}`);

  // ← / Back Android: đã nhập → hỏi trước khi bỏ
  const onBack = useCallback(() => {
    if (!isDirty || submit.isPending) return leave();
    Alert.alert(
      "Bỏ yêu cầu đang soạn?",
      "Lý do và ảnh bạn vừa nhập sẽ không được lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: leave },
      ],
    );
  }, [isDirty, submit.isPending]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [onBack]),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Yêu cầu trả hàng" onBack={onBack} />;
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

  // Đơn đã có yêu cầu → mở luôn yêu cầu đó
  if (order.returnRequestId)
    return <Redirect href={`/returns/${order.returnRequestId}`} />;

  const delivered = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(
    order.status,
  );
  if (!delivered || !deadline) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="return-down-back-outline"
          title="Đơn này chưa trả hàng được"
          description="Chỉ yêu cầu trả được sau khi đã nhận hàng."
        />
      </Screen>
    );
  }

  // Hết hạn (vào màn khi đã quá hạn, hoặc hết giờ trong lúc đang điền)
  if (left === 0) {
    return (
      <Screen scroll header={header} contentStyle={styles.content}>
        <ExpiredView order={order} deadline={deadline} />
      </Screen>
    );
  }

  // Địa chỉ: bản chụp trong đơn (mock: shippingAddress, BE 2c3b597: 3 field phẳng) → sổ địa chỉ theo id
  const address =
    order.shippingAddress ??
    (order.shippingAddressDetail
      ? {
          recipientName: order.shippingRecipientName,
          phone: order.shippingPhone,
          addressDetail: order.shippingAddressDetail,
        }
      : addresses.data?.find((a) => a.id === order.shippingAddressId));

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    submit.mutate(values, {
      onSuccess: (res) => {
        showToast("Đã gửi yêu cầu trả hàng");
        router.replace(`/returns/${res.id}`);
      },
      onError: (e) => {
        if (e.code === ERROR_CODES.RETURN_ALREADY_EXISTS) {
          query.refetch(); // có returnRequestId → tự chuyển sang yêu cầu đó
          return;
        }
        if (e.code === ERROR_CODES.RETURN_WINDOW_EXPIRED) {
          showToast("Đã quá hạn yêu cầu trả hàng");
          query.refetch();
          return;
        }
        setFormError(e.message);
      },
    });
  });

  const footer = (
    <Button
      title="Gửi yêu cầu trả hàng"
      loading={submit.isPending}
      onPress={onSubmit}
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
          Đơn {order.orderNo} · giao{" "}
          {toDate(order.deliveredAt).format("DD/MM HH:mm")}
        </Text>
        <Text style={styles.strong}>Còn {formatTimeLeft(deadline)}</Text>
      </View>

      <Section title="MÓN TRONG ĐƠN">
        {order.items.map((it, i) => (
          <OrderItemRow key={`${it.productId ?? "x"}-${i}`} item={it} />
        ))}
        <Text style={styles.caption}>Yêu cầu trả áp dụng cho cả đơn.</Text>
      </Section>

      <Section title="LÝ DO TRẢ HÀNG *">
        <Controller
          control={control}
          name="reasonKey"
          render={({ field: { value, onChange } }) => (
            <View style={styles.reasons}>
              {RETURN_REASONS.map((r) => (
                <RadioCard
                  key={r.key}
                  title={r.label}
                  selected={value === r.key}
                  onPress={() => onChange(r.key)}
                  style={styles.radio}
                />
              ))}
            </View>
          )}
        />
        {errors.reasonKey ? (
          <Text style={styles.error}>{errors.reasonKey.message}</Text>
        ) : null}
        <Controller
          control={control}
          name="detail"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Mô tả cụ thể"
              required
              multiline
              placeholder="Mô tả cụ thể chỗ không đúng…"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.detail?.message}
            />
          )}
        />
      </Section>

      <Controller
        control={control}
        name="photos"
        render={({ field: { value, onChange } }) => (
          <PhotoPicker
            value={value}
            onChange={onChange}
            max={RETURN_LIMITS.MAX_PHOTOS}
            error={errors.photos?.message}
            label="Ảnh chứng minh"
            helper="Bằng chứng của bạn nếu kho kết luận khác · tối thiểu 1 ảnh."
            pickTitle="Thêm ảnh chứng minh"
            pickMessage="Chụp rõ chỗ không đúng: vết bẩn, rách, nhãn sai…"
          />
        )}
      />

      {address ? (
        <Section title="NƠI SHIPPER TỚI LẤY HÀNG">
          <View style={styles.box}>
            <Text style={styles.strong}>
              {address.recipientName} · {formatPhone(address.phone)}
            </Text>
            <Text style={styles.muted}>{address.addressDetail}</Text>
          </View>
          <Text style={styles.caption}>
            Shipper GHN tới địa chỉ giao của đơn. Cần đổi địa chỉ thì liên hệ
            kho sau khi gửi.
          </Text>
        </Section>
      ) : null}

      {formError ? <ErrorBox message={formError} /> : null}

      <NoteBox>
        Sau khi kho duyệt, bạn có 3 ngày để giao hàng cho shipper. Hoàn tiền vào
        ví ReHome khi kho kiểm tra hàng về hợp lệ.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  reasons: { gap: spacing.sm },
  radio: { flex: 0 },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
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
  kvRow: { flexDirection: "row", justifyContent: "space-between" },
  dim: { gap: spacing.sm, opacity: 0.5 },
});
