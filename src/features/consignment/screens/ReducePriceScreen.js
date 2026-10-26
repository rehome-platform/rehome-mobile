import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/ui/MoneyField";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import {
  calcPayout,
  currentRate,
  formatRate,
  getProductView,
} from "@/utils/consignment";
import { PRODUCT_VIEW } from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { makeReducePriceSchema } from "@/features/consignment/schemas";
import { PayoutBreakdown } from "@/features/consignment/components/PayoutBreakdown";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const roundDown1000 = (n) => Math.floor(n / 1000) * 1000; // −10%, −20% làm tròn xuống nghìn đồng [GIẢ ĐỊNH]

export default function ReducePriceScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Giảm giá bán" onBack={goBack} />;

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
  if (getProductView(query.data) !== PRODUCT_VIEW.SELLING) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="lock-closed-outline"
          title="Không giảm giá được"
          description="Chỉ giảm giá khi sản phẩm đang bán."
        >
          <Button title="Quay lại sản phẩm" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  return <ReducePriceBody product={query.data} header={header} />;
}

// Đầu màn: ảnh nhỏ + tên + "SKU · Kỳ x · hoa hồng r%"
function MiniHead({ product }) {
  return (
    <View style={styles.mini}>
      {product.photoUrl ? (
        <Image source={{ uri: product.photoUrl }} style={styles.miniThumb} />
      ) : (
        <View style={styles.miniThumb} />
      )}
      <View style={styles.flex}>
        <Text style={styles.bold}>{product.name}</Text>
        <Text style={styles.caption}>
          {product.id} · Kỳ {product.currentTerm} · hoa hồng{" "}
          {formatRate(currentRate(product))}
        </Text>
      </View>
    </View>
  );
}

// Lịch sử đổi giá (nếu API trả) [CHỜ BE — DB có PriceChangeLog]
function PriceHistory({ changes }) {
  if (!changes?.length) return null;
  return (
    <View style={styles.history}>
      <Text style={styles.sectionTitle}>LỊCH SỬ ĐỔI GIÁ</Text>
      {changes.map((c, i) => (
        <View
          key={c.changedAt}
          style={[styles.historyRow, i > 0 && styles.divider]}
        >
          <Text style={styles.caption}>
            {dayjs(c.changedAt).format("DD/MM/YYYY HH:mm")}
          </Text>
          <Text style={c.oldPrice == null ? styles.caption : styles.bold}>
            {c.oldPrice == null
              ? `Chốt giá ký gửi ${formatVnd(c.newPrice)}`
              : `${formatVnd(c.oldPrice).replace(" đ", "")} → ${formatVnd(c.newPrice)}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Thanh vị trí: 0 ──── giá sàn ──── giá mới ──── giá gốc
function PriceBar({ floor, value, original, invalid }) {
  const pct = (n) => `${Math.max(0, Math.min(100, (n / original) * 100))}%`;
  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
        <View style={[styles.barFloor, { width: pct(floor) }]} />
        {value != null ? (
          <View
            style={[
              styles.marker,
              { left: pct(value) },
              invalid && styles.markerError,
            ]}
          />
        ) : null}
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.caption}>
          Giá sàn {formatVnd(floor).replace(" đ", "")}
        </Text>
        {value != null ? (
          <Text style={[styles.caption, invalid && styles.errorText]}>
            Giá mới {formatVnd(value).replace(" đ", "")}
          </Text>
        ) : null}
        <Text style={styles.caption}>
          Giá gốc {formatVnd(original).replace(" đ", "")}
        </Text>
      </View>
    </View>
  );
}

function ReducePriceBody({ product, header }) {
  const queryClient = useQueryClient();
  const rate = currentRate(product);
  const changedToday =
    !!product.lastPriceChangedAt &&
    dayjs(product.lastPriceChangedAt).isSame(dayjs(), "day");
  const schema = useMemo(
    () =>
      makeReducePriceSchema({
        currentPrice: product.currentPrice,
        floorPrice: product.floorPrice,
      }),
    [product.currentPrice, product.floorPrice],
  );

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { newPrice: undefined },
  });
  const newPrice = watch("newPrice");
  const belowFloor = newPrice != null && newPrice < product.floorPrice;
  const valid =
    newPrice != null && newPrice < product.currentPrice && !belowFloor;

  const setPrice = (n) =>
    setValue("newPrice", n, { shouldValidate: true, shouldDirty: true });

  const reduce = useMutation({
    mutationFn: (price) => consignmentApi.reducePrice(product.id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: consignKeys.product(product.id),
      });
      queryClient.invalidateQueries({ queryKey: consignKeys.products() });
      showToast("Đã đổi giá bán");
      goBack();
    },
    onError: (e) => {
      if (e.code === ERROR_CODES.PRICE_CHANGE_LIMIT_REACHED) {
        showToast(e.message);
        return queryClient.invalidateQueries({
          queryKey: consignKeys.product(product.id),
        }); // tải lại → hiện "đã đổi hôm nay"
      }
      if (e.code === ERROR_CODES.BELOW_FLOOR_PRICE)
        return setError("newPrice", { message: "Thấp hơn giá sàn" });
      if (e.status === 400) return setError("newPrice", { message: e.message });
      Alert.alert("Chưa đổi được giá", e.message);
    },
  });

  // Hỏi lại trước khi đổi — không hoàn tác được
  const onConfirm = handleSubmit(({ newPrice: price }) =>
    Alert.alert(
      `Đổi giá thành ${formatVnd(price)}?`,
      "Giá mới áp dụng ngay. Bạn không tăng lại được, và hôm nay không đổi thêm lần nữa.",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Đổi giá", onPress: () => reduce.mutate(price) },
      ],
    ),
  );

  // ---- Đã đổi giá hôm nay ----
  if (changedToday) {
    const last = product.priceChanges?.[0];
    const tomorrow = dayjs().add(1, "day").startOf("day");
    const hoursLeft = Math.max(
      1,
      Math.ceil(tomorrow.diff(dayjs(), "minute") / 60),
    );
    return (
      <Screen
        scroll
        header={header}
        contentStyle={styles.content}
        footer={
          <View style={styles.footerRow}>
            <Button
              title="Quay lại sản phẩm"
              variant="secondary"
              onPress={goBack}
              style={styles.flex}
            />
            <Button title="Xác nhận" disabled style={styles.flex} />
          </View>
        }
      >
        <MiniHead product={product} />
        <View style={styles.lockBox}>
          <Text style={styles.boxTitle}>Hôm nay bạn đã đổi giá rồi</Text>
          <Text style={styles.body}>
            Mỗi sản phẩm chỉ được đổi giá{" "}
            <Text style={styles.bold}>1 lần mỗi ngày</Text>.
            {last?.oldPrice != null
              ? ` Bạn đã giảm từ ${formatVnd(last.oldPrice)} xuống ${formatVnd(last.newPrice)} lúc ${dayjs(last.changedAt).format("HH:mm")} hôm nay.`
              : ""}
          </Text>
          <View style={styles.innerBox}>
            <Text style={styles.body}>
              Có thể đổi giá tiếp từ{" "}
              <Text style={styles.bold}>
                00:00 ngày {tomorrow.format("DD/MM/YYYY")}
              </Text>{" "}
              — còn khoảng {hoursLeft} giờ.
            </Text>
          </View>
        </View>
        <MoneyField
          label="Giá bán mới"
          value={product.currentPrice}
          onChange={() => {}}
          editable={false}
          helper={`Hiện tại ${formatVnd(product.currentPrice)}`}
        />
        <PriceHistory changes={product.priceChanges} />
        <NoteBox>
          Giới hạn này để tránh đổi giá liên tục làm người mua mất tin tưởng.
        </NoteBox>
      </Screen>
    );
  }

  // ---- Bình thường / dưới giá sàn ----
  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        <Button
          title={
            valid ? `Xác nhận giá ${formatVnd(newPrice)}` : "Xác nhận giá mới"
          }
          onPress={onConfirm}
          loading={reduce.isPending}
        />
      }
    >
      <MiniHead product={product} />

      <Controller
        control={control}
        name="newPrice"
        render={({ field }) => (
          <MoneyField
            label="Giá bán mới"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={
              belowFloor
                ? `Thấp hơn giá sàn. Mức thấp nhất bạn được đặt là ${formatVnd(product.floorPrice)}.`
                : errors.newPrice?.message
            }
            helper={`Hiện tại ${formatVnd(product.currentPrice)}`}
          />
        )}
      />

      <View style={styles.chips}>
        <Button
          title="−10%"
          variant="secondary"
          style={styles.flex}
          onPress={() => setPrice(roundDown1000(product.currentPrice * 0.9))}
        />
        <Button
          title="−20%"
          variant="secondary"
          style={styles.flex}
          onPress={() => setPrice(roundDown1000(product.currentPrice * 0.8))}
        />
        <Button
          title="Về giá sàn"
          variant="secondary"
          style={styles.flex}
          onPress={() => setPrice(product.floorPrice)}
        />
      </View>

      <PriceBar
        floor={product.floorPrice}
        value={newPrice}
        original={product.agreedPrice}
        invalid={belowFloor}
      />

      {belowFloor ? (
        <View style={styles.errorBox}>
          <View style={styles.errorHead}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.error}
            />
            <Text style={styles.boxTitle}>Không áp dụng được giá này</Text>
          </View>
          <Text style={styles.body}>
            Giá sàn của món hàng là{" "}
            <Text style={styles.bold}>{formatVnd(product.floorPrice)}</Text>,
            bằng 50% giá đã thống nhất lúc ký gửi. Mức này ghi trong biên nhận
            và không đổi được trong suốt kỳ ký gửi.
          </Text>
          <Button
            title="Đặt về giá sàn"
            variant="secondary"
            onPress={() => setPrice(product.floorPrice)}
          />
        </View>
      ) : null}

      {valid ? (
        <PayoutBreakdown
          boxed
          title="VỚI GIÁ MỚI, BẠN NHẬN"
          price={newPrice}
          priceLabel="Giá bán mới"
          rate={rate}
          rateLabel={`Hoa hồng kỳ ${product.currentTerm}`}
        >
          <View style={styles.compare}>
            <Text style={styles.caption}>So với giá hiện tại</Text>
            <Text style={styles.bold}>
              nhận ít hơn{" "}
              {formatVnd(
                calcPayout(product.currentPrice, rate) -
                  calcPayout(newPrice, rate),
              )}
            </Text>
          </View>
        </PayoutBreakdown>
      ) : null}

      <NoteBox>
        <Text style={styles.noteText}>
          Giá mới áp dụng ngay khi xác nhận. Bạn{" "}
          <Text style={styles.bold}>chỉ được giảm, không được tăng lại</Text>,
          và mỗi ngày đổi giá tối đa 1 lần. Muốn tăng giá phải thương lượng lại
          biên nhận với ReHome.
        </Text>
      </NoteBox>

      <PriceHistory changes={product.priceChanges} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  mini: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  miniThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  bold: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  body: { ...textStyles.body, color: colors.text },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  boxTitle: { ...textStyles.heading, color: colors.text },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  chips: { flexDirection: "row", gap: spacing.sm },
  barWrap: { gap: spacing.xs },
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
  },
  barFloor: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.textSecondary,
    opacity: 0.35,
  },
  marker: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 18,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  markerError: { backgroundColor: colors.error },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  errorText: { color: colors.error, fontFamily: fonts.semibold },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  errorHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  compare: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
    borderStyle: "dashed",
  },
  lockBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  innerBox: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  history: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  footerRow: { flexDirection: "row", gap: spacing.md },
});
