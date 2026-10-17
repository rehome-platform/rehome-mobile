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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { FORM_STATUS } from "@/constants/consignment";
import { ERROR_CODES } from "@/constants/errorCodes";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import {
  consignFormSchema,
  formToValues,
} from "@/features/consignment/schemas";
import { uploadPhotos } from "@/features/consignment/utils/photos";
import { ConsignFormFields } from "@/features/consignment/components/ConsignFormFields";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");

// KG-05: tải form (API 17) → chỉ cho sửa khi còn Chờ duyệt
export default function EditFormScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const query = useQuery({
    queryKey: consignKeys.form(id),
    queryFn: () => consignmentApi.getForm(id),
    enabled: status === "authenticated",
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Sửa form ký gửi" onBack={goBack} />;

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
  if (query.data.status !== FORM_STATUS.PENDING) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="lock-closed-outline"
          title="Form không còn sửa được"
          description="Chỉ sửa được khi form đang Chờ duyệt."
        >
          <Button title="Quay lại" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  // Tách component con: useForm cần dữ liệu form ngay lúc khởi tạo (defaultValues)
  return <EditFormBody form={query.data} />;
}

function EditFormBody({ form }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(consignFormSchema),
    defaultValues: formToValues(form, { keepWarehouse: true }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["consign", "forms"] });
    queryClient.invalidateQueries({ queryKey: consignKeys.form(form.id) });
  };

  const save = useMutation({
    mutationFn: async (values) => {
      const { photos, ...rest } = values;
      const photoUrls = await uploadPhotos(photos);
      // API 18: body giống API 15, gửi kèm kho cũ (không đổi kho khi sửa)
      return consignmentApi.updateForm(form.id, {
        ...rest,
        photoUrls,
        warehouseId: form.warehouse?.id,
      });
    },
    onSuccess: () => {
      refresh();
      showToast("Đã lưu thay đổi");
      goBack();
    },
    onError: (e) => {
      if (e.code === ERROR_CODES.FORM_NOT_EDITABLE) {
        showToast("Form đã được kho xử lý, không sửa được nữa");
        refresh();
        return goBack();
      }
      setFormError(e.message);
    },
  });

  // Huỷ / ← / Back Android: đã sửa → hỏi trước khi bỏ
  const onCancel = useCallback(() => {
    if (!isDirty) return goBack();
    Alert.alert("Bỏ thay đổi?", "Những gì bạn vừa sửa sẽ không được lưu.", [
      { text: "Ở lại", style: "cancel" },
      { text: "Bỏ thay đổi", style: "destructive", onPress: goBack },
    ]);
  }, [isDirty]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onCancel();
        return true;
      });
      return () => sub.remove();
    }, [onCancel]),
  );

  const onSave = handleSubmit((values) => {
    setFormError(null);
    save.mutate(values);
  });

  return (
    <Screen
      scroll
      header={<AppHeader title="Sửa form ký gửi" onBack={onCancel} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Huỷ"
            variant="secondary"
            onPress={onCancel}
            style={styles.flex}
          />
          <Button
            title="Lưu thay đổi"
            onPress={onSave}
            disabled={!isDirty}
            loading={save.isPending}
            style={styles.flex}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      <NoteBox>
        <Text style={styles.note}>
          Sửa được khi form còn ở trạng thái{" "}
          <Text style={styles.bold}>Chờ duyệt</Text>. Kho đã chọn (
          <Text style={styles.bold}>{form.warehouse?.name}</Text>) không đổi
          được ở đây.
        </Text>
      </NoteBox>
      <ConsignFormFields control={control} errors={errors} />
      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  note: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
