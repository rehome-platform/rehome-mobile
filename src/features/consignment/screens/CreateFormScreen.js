import { useCallback, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import {
  Redirect,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { CONSIGN_LIMITS } from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import {
  consignFormSchema,
  formToValues,
  STEP1_FIELDS,
} from "@/features/consignment/schemas";
import { uploadPhotos } from "@/features/consignment/utils/photos";
import { ConsignFormFields } from "@/features/consignment/components/ConsignFormFields";
import { WarehouseStep } from "@/features/consignment/components/WarehouseStep";
import { usePendingFormCount } from "@/features/consignment/hooks/usePendingFormCount";

const EMPTY_FORM = {
  photos: [],
  productName: "",
  categoryId: "",
  brandId: "",
  desiredPrice: undefined, // ô trống → zod báo "Nhập giá mong muốn"
  description: "",
  warehouseId: "",
};

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");

// Upload ảnh mới → gửi form (API 15)
async function sendForm(values) {
  const { photos, ...rest } = values;
  const photoUrls = await uploadPhotos(photos);
  return consignmentApi.createForm({ ...rest, photoUrls });
}

// KG-02 + KG-03: một màn, một form, 2 bước. ?fromFormId=… → điền sẵn từ form cũ (bị từ chối / hết hạn)
export default function CreateFormScreen() {
  const status = useAuthStore((s) => s.status);
  const { fromFormId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const pending = usePendingFormCount();

  // Form cũ đã có trong cache (vừa xem ở màn chi tiết). Kho để chọn lại ở bước 2
  const source = fromFormId
    ? queryClient.getQueryData(consignKeys.form(fromFormId))
    : undefined;

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitted },
  } = useForm({
    resolver: zodResolver(consignFormSchema),
    defaultValues: source ? formToValues(source) : EMPTY_FORM,
  });

  const submit = useMutation({
    mutationFn: sendForm,
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ["consign", "forms"] }); // danh sách + số form chờ
      showToast("Đã gửi form ký gửi");
      router.replace(`/consign-forms/${form.id}`);
    },
    onError: (e) => {
      if (e.code === ERROR_CODES.TOO_MANY_PENDING_FORMS) {
        return Alert.alert("Chưa tạo thêm được", e.message, [
          { text: "Về danh sách", onPress: leave },
        ]);
      }
      setFormError(e.message); // mất mạng, lỗi khác → khung lỗi, giữ nguyên dữ liệu đã nhập
    },
  });

  const scrollTop = (animated = true) =>
    scrollRef.current?.scrollTo({ y: 0, animated });

  // ← ở bước 2 → về bước 1. Bước 1 đã nhập → hỏi trước khi bỏ
  const onBack = useCallback(() => {
    if (step === 2) return setStep(1);
    if (!isDirty) return leave();
    Alert.alert(
      "Bỏ form đang tạo?",
      "Thông tin bạn đã nhập sẽ không được lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ form", style: "destructive", onPress: leave },
      ],
    );
  }, [step, isDirty]);

  // Nút Back Android làm giống nút ←
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [onBack]),
  );

  if (status !== "authenticated") return <Redirect href="/login" />;

  // Vào màn khi đã đủ 5 form chờ → báo luôn, khỏi nhập rồi mới bị từ chối
  if (
    pending.data >= CONSIGN_LIMITS.MAX_PENDING_FORMS &&
    !submit.isPending &&
    !submit.isSuccess
  ) {
    return (
      <Screen header={<AppHeader title="Tạo form ký gửi" onBack={leave} />}>
        <EmptyState
          icon="hourglass-outline"
          title={`Bạn đang có ${pending.data} form chờ duyệt`}
          description={`Tối đa ${CONSIGN_LIMITS.MAX_PENDING_FORMS} form chờ cùng lúc. Chờ kho xử lý bớt rồi tạo tiếp nhé.`}
        >
          <Button title="Về danh sách" onPress={leave} />
        </EmptyState>
      </Screen>
    );
  }

  // Bước 1 → kiểm hết các ô (warehouseId chưa bắt buộc). Lỗi → cuộn lên hộp tổng lỗi
  const goStep2 = handleSubmit(
    () => {
      setStep(2);
      scrollTop(false);
    },
    () => scrollTop(),
  );

  const onSend = handleSubmit((values) => {
    if (!values.warehouseId) return setFormError("Chọn kho tiếp nhận");
    setFormError(null);
    submit.mutate(values);
  });

  const step1Errors = STEP1_FIELDS.map((f) => errors[f]?.message).filter(
    Boolean,
  );

  const header = (
    <View>
      <AppHeader
        title={step === 1 ? "Tạo form ký gửi" : "Chọn kho"}
        onBack={onBack}
        right={<Text style={styles.stepText}>Bước {step} / 2</Text>}
      />
      <View style={styles.progress}>
        <View
          style={[styles.progressFill, { width: step === 1 ? "50%" : "100%" }]}
        />
      </View>
    </View>
  );

  return (
    <Screen
      scroll
      scrollRef={scrollRef}
      header={header}
      footer={
        step === 1 ? (
          <Button title="Tiếp tục — chọn kho" onPress={goStep2} />
        ) : (
          <Button
            title="Gửi form ký gửi"
            onPress={onSend}
            loading={submit.isPending}
          />
        )
      }
      contentStyle={styles.content}
    >
      {step === 1 ? (
        <>
          {isSubmitted && step1Errors.length ? (
            <ErrorBox message={`Còn ${step1Errors.length} mục chưa hợp lệ`}>
              <Text style={styles.summary}>{step1Errors.join(" · ")}</Text>
            </ErrorBox>
          ) : null}
          {source ? (
            <NoteBox>
              Đã điền sẵn từ form cũ. Kiểm tra lại ảnh và thông tin (nhất là
              phần kho đã nhắc khi từ chối).
            </NoteBox>
          ) : null}
          <ConsignFormFields control={control} errors={errors} />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="warehouseId"
            render={({ field }) => (
              <WarehouseStep value={field.value} onChange={field.onChange} />
            )}
          />
          <ErrorBox message={formError} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  stepText: { ...textStyles.body, color: colors.textSecondary },
  progress: { height: 3, backgroundColor: colors.neutral },
  progressFill: { height: 3, backgroundColor: colors.primary },
  summary: { ...textStyles.body, color: colors.text },
});
