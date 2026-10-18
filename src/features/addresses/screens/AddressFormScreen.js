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
import { useAddresses, useSaveAddress } from "../hooks/useAddresses";

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
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: existing?.recipientName ?? "",
      phone: formatPhone(existing?.phone ?? ""),
      addressDetail: existing?.addressDetail ?? "",
      isDefault: lockedDefault,
    },
  });

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
        name="addressDetail"
        render={({ field }) => (
          <TextField
            label="Địa chỉ cụ thể"
            required
            multiline
            helper="Số nhà, tên đường, phường/xã, tỉnh/thành phố."
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
      {/* PHASE3_GUIDE 0.4 #5: chưa chọn Tỉnh/Phường từ danh sách — BE chỉ có addressDetail [CHỜ BE dữ liệu GHN] */}
      <NoteBox>
        Ghi đủ số nhà, tên đường, phường/xã và tỉnh/thành phố để shipper giao
        đúng nơi.
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
