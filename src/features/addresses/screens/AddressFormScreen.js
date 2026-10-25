import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Checkbox } from "@/components/ui/Checkbox";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { ADDRESS_LIMIT } from "@/constants/order";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { addressSchema } from "../schemas";
import { SelectField } from "@/components/ui/SelectField";
import {
  useAddresses,
  useProvinces,
  useSaveAddress,
  useWards,
} from "../hooks/useAddresses";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/addresses");

// BR-07 · Thêm (không có id) / Sửa (có id) địa chỉ. Chờ có danh sách rồi mới dựng form (để điền sẵn)
export default function AddressFormScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const addresses = useAddresses();

  if (!isAuthed) return <Redirect href="/login" />;

  const title = id ? "Sửa địa chỉ" : "Thêm địa chỉ";
  const header = <AppHeader title={title} onBack={leave} />;

  if (addresses.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  const list = addresses.data ?? [];
  const existing = id ? list.find((a) => a.id === id) : null;

  if (id && !existing) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="location-outline"
          title="Không tìm thấy địa chỉ"
          description="Địa chỉ này có thể đã bị xoá."
        >
          <Button title="Về danh sách địa chỉ" onPress={leave} />
        </EmptyState>
      </Screen>
    );
  }
  if (!id && list.length >= ADDRESS_LIMIT) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="location-outline"
          title={`Đã đủ ${ADDRESS_LIMIT} địa chỉ`}
          description="Xoá bớt một địa chỉ cũ để thêm địa chỉ mới."
        >
          <Button title="Về danh sách địa chỉ" onPress={leave} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <AddressForm
      title={title}
      existing={existing}
      isFirst={!id && list.length === 0}
    />
  );
}

function AddressForm({ title, existing, isFirst }) {
  const save = useSaveAddress();
  const [formError, setFormError] = useState(null);
  // Địa chỉ đầu tiên, hoặc đang sửa địa chỉ mặc định → luôn là mặc định (muốn đổi thì đặt địa chỉ khác)
  const lockedDefault = isFirst || !!existing?.isDefault;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: existing?.recipientName ?? "",
      phone: formatPhone(existing?.phone ?? ""),
      provinceName: existing?.provinceName ?? "", // địa chỉ cũ (trước BE 868d933) chưa có → bắt chọn lại
      wardName: existing?.wardName ?? "",
      addressDetail: existing?.addressDetail ?? "",
      isDefault: lockedDefault,
    },
  });

  // Tỉnh đang chọn → tìm code để tải phường của tỉnh đó
  const provinceName = watch("provinceName");
  const provinces = useProvinces();
  const provinceId = provinces.data?.find(
    (p) => p.value === provinceName,
  )?.code;
  const wards = useWards(provinceId);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    save.mutate(
      {
        id: existing?.id,
        values: { ...values, isDefault: lockedDefault || values.isDefault },
      },
      {
        onSuccess: () => {
          showToast(existing ? "Đã lưu địa chỉ" : "Đã thêm địa chỉ");
          leave();
        },
        onError: (e) => setFormError(e.message),
      },
    );
  });

  // Đã sửa mà bấm Huỷ / ← → hỏi trước khi bỏ
  const onCancel = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ thay đổi?", "Những gì bạn vừa nhập sẽ không được lưu.", [
      { text: "Nhập tiếp", style: "cancel" },
      { text: "Bỏ thay đổi", style: "destructive", onPress: leave },
    ]);
  };

  return (
    <Screen
      scroll
      header={<AppHeader title={title} onBack={onCancel} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Huỷ"
            variant="secondary"
            onPress={onCancel}
            style={styles.flex}
          />
          <Button
            title="Lưu địa chỉ"
            onPress={onSubmit}
            loading={save.isPending}
            disabled={!!existing && !isDirty} // đang sửa mà chưa đổi gì → không có gì để lưu
            style={styles.flex}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      <Controller
        control={control}
        name="recipientName"
        render={({ field }) => (
          <TextField
            label="Họ tên người nhận"
            required
            autoCapitalize="words"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.recipientName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextField
            label="Số điện thoại"
            required
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
            helper="Shipper gọi số này khi giao hàng."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phone?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="provinceName"
        render={({ field }) => (
          <SelectField
            label="Tỉnh / Thành phố"
            required
            searchable
            placeholder="Chọn tỉnh/thành phố"
            options={provinces.data ?? []}
            loading={provinces.isPending}
            value={field.value}
            onChange={(v) => {
              if (v === field.value) return;
              field.onChange(v);
              setValue("wardName", "", { shouldDirty: true }); // đổi tỉnh → phường cũ không còn đúng
            }}
            error={
              errors.provinceName?.message ??
              (provinces.isError ? provinces.error.message : undefined)
            }
          />
        )}
      />
      <Controller
        control={control}
        name="wardName"
        render={({ field }) => (
          <SelectField
            label="Phường / Xã"
            required
            searchable
            placeholder={
              provinceName ? "Chọn phường/xã" : "Chọn tỉnh/thành phố trước"
            }
            options={wards.data ?? []}
            loading={!!provinceId && wards.isPending}
            value={field.value}
            onChange={field.onChange}
            error={
              errors.wardName?.message ??
              (wards.isError ? wards.error.message : undefined)
            }
          />
        )}
      />
      <Controller
        control={control}
        name="addressDetail"
        render={({ field }) => (
          <TextField
            label="Địa chỉ cụ thể"
            required
            multiline
            helper="Số nhà, tên đường (toà nhà, hẻm nếu có)."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.addressDetail?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="isDefault"
        render={({ field }) => (
          <Checkbox
            checked={lockedDefault || field.value}
            onChange={field.onChange}
            disabled={lockedDefault}
          >
            {isFirst
              ? "Đặt làm địa chỉ mặc định (địa chỉ đầu tiên luôn là mặc định)"
              : existing?.isDefault
                ? "Đây là địa chỉ mặc định. Muốn đổi, hãy đặt một địa chỉ khác làm mặc định."
                : "Đặt làm địa chỉ mặc định"}
          </Checkbox>
        )}
      />
      {/* Tỉnh/phường lấy từ danh mục GHN (BE 868d933) → tên luôn khớp, phí ship tính đúng */}
      <NoteBox>
        Phường/xã theo địa giới mới (sau sáp nhập 01/07/2025). Không thấy phường
        cũ của bạn? Hãy tìm tên phường mới đã sáp nhập.
      </NoteBox>
      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
});
