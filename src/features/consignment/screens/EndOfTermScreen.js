import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import { daysLeft, getProductView, productTiming } from "@/utils/consignment";
import { END_OF_TERM_DECISION, PRODUCT_VIEW } from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { PickupInfo } from "@/features/consignment/components/PickupInfo";

const { TAKE_BACK, RE_CONSIGN } = END_OF_TERM_DECISION;
const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");

function Option({ title, description, note, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.body}>{description}</Text>
        <View style={styles.optionNote}>
          <Text style={styles.caption}>{note}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function EndOfTermScreen() {
  const { id, choice } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;
  const header = <AppHeader title="Xử lý cuối kỳ" onBack={goBack} />;

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
  const view = getProductView(product);
  if (view === PRODUCT_VIEW.REPRICING)
    return <Redirect href={`/my-products/${product.id}/reconsign`} />;
  if (view === PRODUCT_VIEW.PICKUP) {
    // Vừa chọn nhận lại (hoặc đã chọn từ trước) → hướng dẫn lấy hàng
    return (
      <Screen
        header={header}
        contentStyle={styles.content}
        footer={
          <Button title="Về sản phẩm" variant="secondary" onPress={goBack} />
        }
      >
        <PickupInfo product={product} />
      </Screen>
    );
  }
  if (view !== PRODUCT_VIEW.AWAITING_DECISION) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="checkmark-done-outline"
          title="Không cần xử lý"
          description="Sản phẩm này không ở giai đoạn chọn cách xử lý cuối kỳ."
        >
          <Button title="Quay lại" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <EndOfTermBody
      product={product}
      header={header}
      initialChoice={[TAKE_BACK, RE_CONSIGN].includes(choice) ? choice : null}
    />
  );
}

function EndOfTermBody({ product, header, initialChoice }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(initialChoice);
  const [error, setError] = useState(null);
  const decision = product.endOfTermDecision;
  const left = daysLeft(decision.deadline);
  const total = productTiming(product).totalDays;
  const history = product.termHistory ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: consignKeys.product(product.id),
    });
    queryClient.invalidateQueries({ queryKey: consignKeys.products() });
  };

  const decide = useMutation({
    mutationFn: (d) => consignmentApi.decideEndOfTerm(decision.id, d),
    onSuccess: (_, d) => {
      refresh(); // tải lại → màn tự chuyển sang "Nhận lại hàng" (PICKUP)
      if (d === RE_CONSIGN)
        router.replace(`/my-products/${product.id}/reconsign`);
      else showToast("Đã ghi nhận: nhận lại hàng");
    },
    onError: (e) => {
      if (e.code === ERROR_CODES.DECISION_EXPIRED) {
        refresh();
        return Alert.alert("Đã quá hạn", e.message, [
          { text: "Đóng", onPress: goBack },
        ]);
      }
      Alert.alert("Chưa ghi nhận được", e.message);
    },
  });

  const onConfirm = () => {
    if (!selected) return setError("Chọn một trong hai cách xử lý");
    const takeBack = selected === TAKE_BACK;
    Alert.alert(
      takeBack ? "Nhận lại hàng?" : "Ký gửi lại?",
      takeBack
        ? `Bạn có 7 ngày để đến ${product.warehouseName} nhận hàng. Lựa chọn này không đổi lại được.`
        : "Kho sẽ xem lại tình trạng và đề xuất giá mới, bạn xác nhận biên nhận mới thì hàng lên sàn lại. Lựa chọn này không đổi lại được.",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xác nhận", onPress: () => decide.mutate(selected) },
      ],
    );
  };

  const pick = (v) => {
    setSelected(v);
    setError(null);
  };

  return (
    <Screen
      scroll
      header={header}
      padded={false}
      contentStyle={styles.noPad}
      footer={
        <Button
          title="Xác nhận lựa chọn"
          onPress={onConfirm}
          loading={decide.isPending}
        />
      }
    >
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Còn {left} ngày để quyết định</Text>
        <Text style={styles.body}>
          Hạn phản hồi {dayjs(decision.deadline).format("DD/MM/YYYY")}. Quá hạn,
          bạn <Text style={styles.bold}>mất quyền sở hữu</Text> món hàng và
          ReHome chuyển cho tổ chức từ thiện đối tác.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.product}>
          {product.photoUrl ? (
            <Image source={{ uri: product.photoUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.thumb} />
          )}
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>{product.name}</Text>
            <Text style={styles.caption}>
              {[product.brandName, product.size ? `Size ${product.size}` : null]
                .filter(Boolean)
                .join(" · ")}{" "}
              · giá cuối {formatVnd(product.currentPrice)}
            </Text>
            <Text style={styles.caption}>
              Đang giữ tại {product.warehouseName}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CHỌN MỘT TRONG HAI</Text>
        <Option
          title="Nhận lại hàng — miễn phí"
          description={`Sản phẩm được giữ lại cho bạn. Đến ${product.warehouseName} trong 7 ngày kể từ khi xác nhận, đọc mã Member tại quầy để nhận.`}
          note="Không tính phí rút hàng ở bước này, kể cả khi đã ngoài cửa sổ rút miễn phí đầu kỳ."
          selected={selected === TAKE_BACK}
          onPress={() => pick(TAKE_BACK)}
        />
        <Option
          title="Ký gửi lại với giá mới"
          description="Hàng ở nguyên kho, bạn không phải đi lại. Moderator xem lại tình trạng và đề xuất giá mới, bạn đồng ý thì ký biên nhận mới."
          note={`Chu kỳ ${total} ngày tính lại từ đầu, hoa hồng về mức kỳ 1.`}
          selected={selected === RE_CONSIGN}
          onPress={() => pick(RE_CONSIGN)}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {history.length >= 2 ? (
          <NoteBox>
            {`Sản phẩm đã qua ${history.length} kỳ, giá hạ từ ${formatVnd(history[0].price)} xuống ${formatVnd(
              history[history.length - 1].price,
            )} mà chưa bán được. Cân nhắc hạ tiếp hoặc nhận về.`}
          </NoteBox>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  noPad: { paddingBottom: spacing.lg },
  content: { gap: spacing.lg, padding: spacing.lg },
  flex: { flex: 1 },
  banner: {
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.neutral,
  },
  bannerTitle: { ...textStyles.title, color: colors.text },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  sectionTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  product: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  option: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  radio: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionBody: { flex: 1, gap: spacing.sm },
  optionTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  optionNote: {
    padding: spacing.sm,
    borderRadius: radius.input / 2,
    backgroundColor: colors.background,
  },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
