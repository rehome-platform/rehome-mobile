import { useCallback, useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import {
  Redirect,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { useTryonJobStore } from "@/stores/tryonJobStore";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import {
  MODEL_TYPE,
  MODEL_TYPE_LABEL,
  TRYON_JOB_STATUS as J,
  TRYON_SLOT as S,
  TRYON_SLOT_LABEL,
} from "@/constants/tryon";
import { useProductDetail } from "@/features/products/hooks/useProductDetail";
import { tryonApi } from "../api/tryonApi";
import { useTryonDraftStore } from "../store/tryonDraftStore";
import {
  buildTryonPayload,
  canTryOn,
  isOutfitComplete,
  outfitItems,
  slotKey,
  slotOf,
} from "../utils/tryonRules";
import { SlotCard } from "../components/SlotCard";
import { TryonWaiting } from "../components/TryonWaiting";

const MODEL_CHIPS = [MODEL_TYPE.FEMALE, MODEL_TYPE.MALE].map((v) => ({
  value: v,
  label: MODEL_TYPE_LABEL[v],
}));
const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// AI-01 · Phòng thử đồ + AI-03 · Đang tạo ảnh (/tryon?productId=)
export default function TryonRoomScreen() {
  const { productId } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useProductDetail(productId);
  const product = query.data;
  const { baseId, modelType, outfit, open, setModelType, remove } =
    useTryonDraftStore();
  const job = useTryonJobStore((s) => s.job);
  const start = useTryonJobStore((s) => s.start);
  const cancel = useTryonJobStore((s) => s.cancel);
  const clear = useTryonJobStore((s) => s.clear);
  const setWatching = useTryonJobStore((s) => s.setWatching);

  useEffect(() => {
    if (product && canTryOn(product)) open(product);
  }, [product?.id]);

  // Đang mở màn → xong thì tự sang kết quả (không hỏi)
  useFocusEffect(
    useCallback(() => {
      setWatching(true);
      return () => setWatching(false);
    }, []),
  );
  useEffect(() => {
    if (job?.status === J.DONE && useTryonJobStore.getState().watching) {
      const id = job.resultId;
      clear();
      router.replace(`/tryon/result/${id}`);
    }
  }, [job?.status]);

  if (!isAuthed) return <Redirect href="/login" />;

  // ----- AI-03: đang tạo -----
  if (job?.status === J.RUNNING) {
    const confirmCancel = () =>
      Alert.alert(
        "Huỷ tạo ảnh?",
        "Nếu máy chủ đã tạo xong, ảnh vẫn có trong bộ sưu tập của bạn.",
        [
          { text: "Chờ tiếp", style: "cancel" },
          { text: "Huỷ", style: "destructive", onPress: cancel },
        ],
      );
    return (
      <Screen
        scroll
        header={<AppHeader title="Đang tạo ảnh" onBack={goBack} />}
        footer={
          <View style={styles.footerRow}>
            <Button
              title="Chạy nền, báo tôi khi xong"
              variant="secondary"
              onPress={goBack}
              style={styles.flex2}
            />
            <Button
              title="Huỷ"
              variant="text"
              onPress={confirmCancel}
              style={styles.flex1}
            />
          </View>
        }
      >
        <TryonWaiting job={job} />
      </Screen>
    );
  }

  // ----- Lỗi tạo ảnh -----
  if (job?.status === J.ERROR) {
    const incomplete = job.error?.code === ERROR_CODES.INCOMPLETE_OUTFIT;
    return (
      <Screen
        header={<AppHeader title="Phòng thử đồ" onBack={goBack} />}
        footer={
          <View style={styles.footerRow}>
            <Button
              title="Quay lại"
              variant="secondary"
              onPress={clear}
              style={styles.flex1}
            />
            {!incomplete ? (
              <Button
                title="Thử lại"
                onPress={() => start(job.payload, job.items)}
                style={styles.flex1}
              />
            ) : null}
          </View>
        }
      >
        <ErrorBox
          message={
            incomplete
              ? "Bộ đồ chưa đủ: cần áo và quần, hoặc một chiếc đầm."
              : "Chưa tạo được ảnh. Máy chủ AI đang bận hoặc quá giờ. Bộ đồ vẫn giữ nguyên, bạn thử lại nhé."
          }
        />
      </Screen>
    );
  }

  // ----- AI-01 -----
  const header = (
    <AppHeader
      title="Phòng thử đồ"
      onBack={goBack}
      right={
        <Button
          title="Bộ sưu tập"
          variant="text"
          onPress={() => router.push("/tryon/collection")}
        />
      }
    />
  );

  if (!product) {
    return (
      <Screen header={header}>
        {query.isError ? (
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        ) : (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        )}
      </Screen>
    );
  }
  if (!canTryOn(product)) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="shirt-outline"
          title="Món này chưa hỗ trợ thử đồ"
          description="Thử đồ AI dùng được với áo, quần và đầm đang bán."
        />
      </Screen>
    );
  }

  const baseSlot = slotOf(product);
  const ready = baseId === product.id && isOutfitComplete(outfit);
  const slots = baseSlot === S.DRESS ? [S.DRESS] : [S.TOP, S.BOTTOM];
  const missing = slots.find((s) => !outfit[slotKey(s)]);
  const model = MODEL_TYPE_LABEL[modelType].toLowerCase();

  const pickFor = (slot) =>
    router.push({
      pathname: "/tryon/pick",
      params: { slot, excludeId: product.id },
    });
  const create = () =>
    start(buildTryonPayload({ modelType, ...outfit }), outfitItems(outfit));

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Tạo ảnh thử đồ" disabled={!ready} onPress={create} />
          <Text style={styles.caption}>
            {ready
              ? "Mất khoảng 30 giây. Ảnh chỉ để hình dung, không phản ánh size thật trên người bạn."
              : `Cần đủ cả áo và quần mới tạo được ảnh. Hãy chọn thêm một chiếc ${TRYON_SLOT_LABEL[missing]?.toLowerCase() ?? "món"}.`}
          </Text>
        </View>
      }
    >
      <View style={styles.modelRow}>
        <Text style={styles.muted}>Người mẫu</Text>
        <ChipGroup
          options={MODEL_CHIPS}
          value={modelType}
          onChange={setModelType}
        />
      </View>

      {/* [GIẢ ĐỊNH 0.5 A8] chưa có ảnh người mẫu — tạm khung + icon */}
      <View style={styles.model}>
        <Ionicons name="body-outline" size={96} color={colors.textSecondary} />
        <Text style={styles.modelLabel}>
          Người mẫu {model} — {ready ? "sẵn sàng tạo ảnh" : "chưa có outfit"}
        </Text>
      </View>

      <View style={styles.slots}>
        {slots.map((slot) => (
          <SlotCard
            key={slot}
            slot={slot}
            item={outfit[slotKey(slot)]}
            locked={slot === baseSlot}
            onPick={() => pickFor(slot)}
            onRemove={() => remove(slot)}
          />
        ))}
      </View>

      {__DEV__ && MOCK.tryon ? (
        <NoteBox>
          <View style={styles.mock}>
            <Text style={styles.caption}>Mock (chỉ bản dev)</Text>
            <Button
              title="Lần tạo ảnh sau bị lỗi"
              variant="text"
              onPress={() => {
                tryonApi.mockFailNextTryon();
                showToast("Lần tạo ảnh sau sẽ lỗi 502");
              }}
            />
          </View>
        </NoteBox>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  footer: { gap: spacing.xs },
  footerRow: { flexDirection: "row", gap: spacing.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  muted: { ...textStyles.body, color: colors.textSecondary },
  caption: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  modelRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  model: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  modelLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  slots: { flexDirection: "row", gap: spacing.md },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
});
