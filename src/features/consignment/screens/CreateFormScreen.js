import { useCallback, useEffect, useRef, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { NoteBox } from "@/components/ui/NoteBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { saveItemDraft } from "@/features/consignment/utils/consignDraft";
import { draftToItem } from "@/features/consignment/utils/consignItem";
import { useConsignBatchStore } from "@/features/consignment/store/consignBatchStore";
import { WarehouseStep } from "@/features/consignment/components/WarehouseStep";
import { BatchItemCard } from "@/features/consignment/components/BatchItemCard";
import { usePendingFormCount } from "@/features/consignment/hooks/usePendingFormCount";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { formToItem } from "@/features/consignment/utils/consignItem";

const STEPS = ["Địa điểm", "Món", "Xem lại"];

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");

// KG-02 / KG-03 · "Ký gửi món mới": Địa điểm (gần nhất lên đầu) → Món sẽ mang tới (thêm nhiều món)
// → Xem lại & gửi. Mỗi món đã "Lưu món" là 1 nháp trên server; Gửi = POST /consignment-forms/submit cả lô
// vào kho đã chọn (mỗi món một yêu cầu; món lỗi giữ lại kèm lý do để gửi lại).
// Mở màn: có nháp cũ → tải về (lần trước thoát giữa chừng / tắt app). ?fromFormId=… → ký gửi lại yêu cầu cũ
export default function CreateFormScreen() {
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const pending = usePendingFormCount();

  const warehouse = useConsignBatchStore((s) => s.warehouse);
  const items = useConsignBatchStore((s) => s.items);
  const setWarehouse = useConsignBatchStore((s) => s.setWarehouse);
  const removeItem = useConsignBatchStore((s) => s.removeItem);
  const reset = useConsignBatchStore((s) => s.reset);
  const saveItem = useConsignBatchStore((s) => s.saveItem);
  const { fromFormId } = useLocalSearchParams();

  // "Ký gửi lại từ thông tin này" (yêu cầu bị từ chối / hết hạn): yêu cầu cũ đã có trong cache
  // (vừa xem ở màn chi tiết) → thành 1 món, chọn sẵn địa điểm cũ, mở luôn màn sửa món
  // để chọn lại size / tình trạng và sửa theo lý do từ chối. Chỉ chạy 1 lần
  const prefilled = useRef(false);
  useEffect(() => {
    if (!fromFormId || prefilled.current) return;
    prefilled.current = true;
    const form = queryClient.getQueryData(consignKeys.form(fromFormId));
    if (!form) return;
    reset();
    const item = formToItem(form);
    saveItem(item);
    if (form.warehouse) setWarehouse(form.warehouse);
    router.push({ pathname: "/consign-forms/item", params: { key: item.key } });
  }, [fromFormId]);

  // Mở lại nháp đã lưu trên server (chưa có món nào trong lần gửi đang soạn). Chạy 1 lần
  const [restoring, setRestoring] = useState(false);
  const restored = useRef(false);
  useEffect(() => {
    if (fromFormId || restored.current || items.length) return;
    restored.current = true;
    setRestoring(true);
    consignmentApi
      .getDrafts()
      .then((drafts) => {
        if (!drafts.length) return;
        drafts.map(draftToItem).forEach(saveItem);
        showToast(`Đã mở lại ${drafts.length} món bạn lưu nháp`);
      })
      .catch(() => {}) // không tải được nháp → vẫn tạo mới bình thường
      .finally(() => setRestoring(false));
  }, [fromFormId]);

  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState({}); // key món → { ok, message }
  // Bước Xem lại: món BỎ tích (mặc định tích hết) → không gửi lần này, vẫn giữ nháp để lần sau gửi
  const [skipped, setSkipped] = useState(() => new Set());
  const selectedItems = items.filter((i) => !skipped.has(i.key));
  const toggleItem = (key) =>
    setSkipped((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const allSelected = selectedItems.length === items.length;
  const toggleAll = () =>
    setSkipped(allSelected ? new Set(items.map((i) => i.key)) : new Set());

  // Số yêu cầu chờ duyệt tối đa do Admin cấu hình (BE max_pending_forms_per_member) và app chưa đọc được →
  // KHÔNG tự chặn. BE /submit trả kết quả TỪNG MÓN: món vượt mức hiện "chưa gửi được" kèm lý do của BE

  const go = (n) => {
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const quit = () => {
    reset();
    leave();
  };

  // Xoá nháp trên server của các món (món chưa lưu nháp — ký gửi lại chưa bấm Lưu — không có draftId)
  const deleteDrafts = (list) =>
    Promise.allSettled(
      list
        .filter((i) => i.draftId)
        .map((i) => consignmentApi.deleteDraft(i.draftId)),
    );

  // ← / Back Android: lùi 1 bước; ở bước đầu mà đã có món → hỏi: giữ nháp để lần sau gửi tiếp, hay xoá hết
  const onBack = useCallback(() => {
    if (sending) return;
    if (step > 0) return go(step - 1);
    if (!items.length) return quit();
    Alert.alert(
      "Thoát lần ký gửi này?",
      `${items.length} món đã được lưu nháp. Lần sau mở "Ký gửi món mới" để gửi tiếp.`,
      [
        { text: "Ở lại", style: "cancel" },
        {
          text: "Xoá nháp",
          style: "destructive",
          onPress: async () => {
            await deleteDrafts(items);
            quit();
          },
        },
        { text: "Giữ nháp", onPress: quit },
      ],
    );
  }, [step, items, sending]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [onBack]),
  );

  const confirmRemove = (item) =>
    Alert.alert("Xoá món này?", item.productName, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            if (item.draftId) await consignmentApi.deleteDraft(item.draftId);
            removeItem(item.key);
          } catch (e) {
            Alert.alert("Chưa xoá được món", e.message);
          }
        },
      },
    ]);

  // Chỉ gửi các món ĐANG TÍCH ở bước Xem lại:
  // 1) Món chưa có nháp (ký gửi lại chưa bấm Lưu) → lưu nháp trước, lần lượt (không dồn nhiều upload)
  // 2) Gửi cả lô 1 lần: POST /submit vào kho đã chọn → kết quả từng món
  const sendAll = async () => {
    setSending(true);
    const next = {};
    const ready = [];
    const toSend = selectedItems;
    for (const item of toSend) {
      try {
        const synced = item.draftId ? item : await saveItemDraft(item);
        if (synced !== item) saveItem(synced);
        ready.push(synced);
      } catch (e) {
        next[item.key] = { ok: false, message: e.message };
      }
    }
    if (ready.length) {
      try {
        const res = await consignmentApi.submitDrafts({
          warehouseId: warehouse.id,
          formIds: ready.map((i) => i.draftId),
        });
        ready.forEach((item) => {
          const r = res.results.find((x) => x.formId === item.draftId);
          next[item.key] = r?.success
            ? { ok: true }
            : { ok: false, message: r?.message ?? "Chưa gửi được món này." };
        });
      } catch (e) {
        ready.forEach((item) => {
          next[item.key] = { ok: false, message: e.message };
        });
      }
    }
    setResults(next);
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["consign", "forms"] }); // danh sách + số yêu cầu chờ

    const okKeys = Object.keys(next).filter((k) => next[k].ok);
    const keptDrafts = items.length - toSend.length; // món bỏ tích → vẫn là nháp trên server
    if (okKeys.length === toSend.length) {
      showToast(
        keptDrafts
          ? `Đã gửi ${okKeys.length} yêu cầu. ${keptDrafts} món còn lại vẫn lưu nháp để gửi sau`
          : `Đã gửi ${okKeys.length} yêu cầu ký gửi`,
      );
      reset();
      return router.replace("/consign");
    }
    okKeys.forEach(removeItem); // món đã gửi xong → bỏ khỏi lần gửi, chỉ giữ món lỗi + món bỏ tích
    if (okKeys.length)
      showToast(
        `Đã gửi ${okKeys.length} món, còn ${toSend.length - okKeys.length} món chưa gửi được`,
      );
  };

  if (status !== "authenticated") return <Redirect href="/login" />;

  const footer = [
    <Button
      key="0"
      title="Tiếp tục — thêm món"
      disabled={!warehouse}
      onPress={() => go(1)}
    />,
    <Button
      key="1"
      title={
        items.length
          ? `Tiếp tục — xem lại (${items.length} món)`
          : "Thêm ít nhất 1 món"
      }
      disabled={!items.length}
      onPress={() => go(2)}
    />,
    <Button
      key="2"
      title={
        selectedItems.length
          ? `Gửi ${selectedItems.length} yêu cầu ký gửi`
          : "Tích ít nhất 1 món để gửi"
      }
      loading={sending}
      disabled={!selectedItems.length}
      onPress={sendAll}
    />,
  ][step];

  return (
    <Screen
      scroll
      scrollRef={scrollRef}
      header={
        <View>
          <AppHeader title="Ký gửi món mới" onBack={onBack} />
          <View style={styles.stepper}>
            <Stepper steps={STEPS} current={step} />
          </View>
        </View>
      }
      footer={footer}
      contentStyle={styles.content}
    >
      {step === 0 ? (
        <>
          <Text style={styles.title}>Bạn sẽ mang đồ tới đâu?</Text>
          <WarehouseStep
            value={warehouse?.id}
            onChange={(_id, w) => setWarehouse(w)}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View style={styles.place}>
            <View style={styles.flex}>
              <Text style={styles.muted}>Mang tới</Text>
              <Text style={styles.placeName}>{warehouse?.name}</Text>
            </View>
            <Button title="Đổi" variant="text" onPress={() => go(0)} />
          </View>

          {items.length ? (
            items.map((item) => (
              <BatchItemCard
                key={item.key}
                item={item}
                onEdit={() =>
                  router.push({
                    pathname: "/consign-forms/item",
                    params: { key: item.key },
                  })
                }
                onRemove={() => confirmRemove(item)}
              />
            ))
          ) : restoring ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <EmptyState
              icon="shirt-outline"
              title="Chưa có món nào"
              description="Thêm từng món bạn sẽ mang tới. Mỗi món ReHome duyệt riêng. Món đã lưu được giữ làm nháp, thoát giữa chừng không mất."
            />
          )}

          <Button
            title="+ Thêm món"
            variant="secondary"
            onPress={() => router.push("/consign-forms/item")}
          />
          {pending.data ? (
            <Text style={styles.hint}>
              Bạn đang có {pending.data} yêu cầu chờ duyệt. ReHome giới hạn số
              yêu cầu chờ cùng lúc — món vượt mức sẽ được báo khi gửi và vẫn giữ
              làm nháp.
            </Text>
          ) : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View style={styles.placeBox}>
            <Text style={styles.muted}>Địa điểm ký gửi</Text>
            <Text style={styles.placeName}>{warehouse?.name}</Text>
            {warehouse?.address ? (
              <Text style={styles.muted}>{warehouse.address}</Text>
            ) : null}
          </View>

          <View style={styles.pickHead}>
            <Text style={[styles.title, styles.flex]}>
              Gửi {selectedItems.length}/{items.length} món
            </Text>
            {items.length > 1 ? (
              <Button
                title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                variant="text"
                onPress={toggleAll}
              />
            ) : null}
          </View>
          <Text style={styles.hint}>
            Bỏ tích món chưa muốn gửi. Món đó vẫn được lưu nháp để lần sau gửi
            tiếp.
          </Text>
          {items.map((item) => (
            <BatchItemCard
              key={item.key}
              item={item}
              result={results[item.key]}
              selected={!skipped.has(item.key)}
              onToggle={sending ? undefined : () => toggleItem(item.key)}
            />
          ))}
          <NoteBox>
            <Text style={styles.note}>
              ReHome duyệt <Text style={styles.bold}>từng món</Text> (thường 1–2
              ngày làm việc). Món nào được duyệt, bạn mang tới địa điểm này{" "}
              <Text style={styles.bold}>trước hạn ghi trên yêu cầu</Text>.
            </Text>
          </NoteBox>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  title: { ...textStyles.heading, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  hint: { ...textStyles.caption, color: colors.textSecondary },
  pickHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
  place: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  placeName: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  placeBox: {
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.highlight,
  },
  note: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
