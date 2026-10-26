import { useCallback, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { TextField } from "@/components/ui/TextField";
import { MoneyField } from "@/components/ui/MoneyField";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { CONSIGN_LIMITS } from "@/constants/consignment";
import {
  CONDITION,
  CONDITION_OPTIONS,
  sizeOptionsOf,
} from "@/constants/consignItem";
import { consignItemInfoSchema } from "@/features/consignment/schemas";
import { useConsignBatchStore } from "@/features/consignment/store/consignBatchStore";
import {
  missingSlots,
  suggestName,
} from "@/features/consignment/utils/consignItem";
import { CategoryPicker } from "../components/CategoryPicker";
import { BrandPicker } from "../components/BrandPicker";
import { SlotPhotoPicker } from "../components/SlotPhotoPicker";

const STEPS = ["Danh mục", "Thương hiệu", "Ảnh", "Thông tin"];

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/consign-forms/new");

// "Thêm món" (có ?key=… → sửa món): Danh mục → Thương hiệu → Ảnh theo khung → Thông tin.
// Xong → lưu vào "lần gửi" (consignBatchStore) rồi quay lại danh sách món. Chưa gọi API ở đây
export default function ItemEditorScreen() {
  const { key } = useLocalSearchParams();
  const editing = useConsignBatchStore((s) =>
    key ? s.items.find((i) => i.key === key) : undefined,
  );
  const saveItem = useConsignBatchStore((s) => s.saveItem);
  const scrollRef = useRef(null);

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(
    editing?.categoryId
      ? {
          categoryId: editing.categoryId,
          categoryName: editing.categoryName,
          group: editing.group,
        }
      : null,
  );
  const [brand, setBrand] = useState(
    editing?.brandId
      ? { brandId: editing.brandId, brandName: editing.brandName }
      : null,
  );

  const [photos, setPhotos] = useState(editing?.photos ?? { extra: [] });
  const [photoError, setPhotoError] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(consignItemInfoSchema),
    defaultValues: {
      productName: editing?.productName ?? "",
      size: editing?.size ?? "",
      condition: editing?.condition ?? "",
      desiredPrice: editing?.desiredPrice,
      note: editing?.note ?? "",
    },
  });
  const condition = watch("condition");

  const scrollTop = () =>
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  const go = (n) => {
    setStep(n);
    scrollTop();
  };

  // ← / nút Back Android: lùi 1 bước; ở bước đầu mà đã chọn gì → hỏi trước khi bỏ
  const onBack = useCallback(() => {
    if (step > 0) return go(step - 1);
    if (!cat && !editing) return leave();
    Alert.alert(
      editing ? "Bỏ thay đổi?" : "Bỏ món đang thêm?",
      "Thông tin vừa nhập sẽ không được lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: leave },
      ],
    );
  }, [step, cat, editing]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [onBack]),
  );

  // Ảnh: khung bắt buộc phải đủ. Lần đầu sang bước Thông tin → gợi ý tên "Áo khoác Uniqlo"
  const nextFromPhotos = () => {
    const missing = missingSlots({ group: cat.group, photos });
    if (missing.length) {
      setPhotoError(`Còn thiếu ảnh: ${missing.join(", ")}`);
      return scrollTop();
    }
    setPhotoError(null);
    if (!getValues("productName"))
      setValue("productName", suggestName({ ...cat, ...brand }));
    go(3);
  };

  const onSave = handleSubmit((values) => {
    saveItem({ ...cat, ...brand, photos, ...values, key: editing?.key });
    leave();
  });

  const footer = [
    <Button
      key="0"
      title="Tiếp tục — thương hiệu"
      disabled={!cat}
      onPress={() => go(1)}
    />,
    <Button
      key="1"
      title="Tiếp tục — chụp ảnh"
      disabled={!brand}
      onPress={() => go(2)}
    />,
    <Button key="2" title="Tiếp tục — thông tin" onPress={nextFromPhotos} />,
    <Button
      key="3"
      title={editing ? "Lưu thay đổi" : "Lưu món"}
      onPress={onSave}
    />,
  ][step];

  return (
    <Screen
      scroll
      scrollRef={scrollRef}
      header={
        <View>
          <AppHeader title={editing ? "Sửa món" : "Thêm món"} onBack={onBack} />
          <View style={styles.stepper}>
            <Stepper steps={STEPS} current={step} />
          </View>
        </View>
      }
      footer={footer}
      contentStyle={styles.content}
    >
      {step === 0 ? (
        <CategoryPicker value={cat?.categoryId} onChange={setCat} />
      ) : null}

      {step === 1 ? (
        <BrandPicker value={brand?.brandId} onChange={setBrand} />
      ) : null}

      {step === 2 ? (
        <>
          <ErrorBox message={photoError} />
          <SlotPhotoPicker
            group={cat.group}
            value={photos}
            onChange={setPhotos}
            max={CONSIGN_LIMITS.MAX_PHOTOS}
            showErrors={!!photoError}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Text style={styles.summary}>
            {cat.categoryName} · {brand.brandName}
          </Text>

          <Controller
            control={control}
            name="productName"
            render={({ field }) => (
              <TextField
                label="Tên sản phẩm"
                required
                maxLength={100}
                helper="Đã gợi ý từ danh mục và thương hiệu — thêm màu, kiểu dáng cho rõ."
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.productName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="size"
            render={({ field }) => (
              <View style={styles.field}>
                <Text style={styles.label}>
                  Size <Text style={styles.required}>*</Text>
                </Text>
                <ChipGroup
                  options={sizeOptionsOf(cat.group)}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.size?.message}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="condition"
            render={({ field }) => (
              <View style={styles.field}>
                <Text style={styles.label}>
                  Tình trạng <Text style={styles.required}>*</Text>
                </Text>
                <ChipGroup
                  options={CONDITION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.condition?.message}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="desiredPrice"
            render={({ field }) => (
              <MoneyField
                label="Giá mong muốn"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.desiredPrice?.message}
              />
            )}
          />
          <NoteBox>
            Đây chỉ là giá bạn đề xuất. Nhân viên sẽ kiểm định và chốt giá bán
            cuối cùng với bạn tại địa điểm ký gửi.
          </NoteBox>

          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <TextField
                label={
                  condition === CONDITION.FLAW ? "Mô tả lỗi" : "Ghi chú thêm"
                }
                required={condition === CONDITION.FLAW}
                multiline
                maxLength={800}
                placeholder={
                  condition === CONDITION.FLAW
                    ? "VD: vết ố nhỏ ở cổ áo, sờn nhẹ tay áo"
                    : "VD: mặc 2 lần, chất vải dày, còn túi đựng"
                }
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.note?.message}
              />
            )}
          />
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
  summary: { ...textStyles.label, color: colors.textSecondary },
  field: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
});
