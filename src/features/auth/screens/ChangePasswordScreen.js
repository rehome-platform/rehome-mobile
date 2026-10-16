import { useState } from "react";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { changePasswordSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/stores/authStore";
import { ERROR_CODES } from "@/constants/errorCodes";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

export default function ChangePasswordScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const [formError, setFormError] = useState(null);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", newPasswordRepeat: "" },
  });

  // watch: lấy giá trị đang gõ để PasswordChecklist cập nhật theo từng phím
  const oldPassword = watch("oldPassword");
  const newPassword = watch("newPassword");

  const change = useMutation({
    mutationFn: async (values) => {
      // [TẠM] API đổi mật khẩu nằm dưới /api/auth nên client.js KHÔNG tự refresh (token hết hạn → BE trả 500).
      // Gọi getMe() trước: đi qua /members/me nên token hết hạn sẽ được làm mới [CHỜ BE]
      await authApi.getMe();
      return authApi.changePassword(values);
    },
    onSuccess: async () => {
      // BE đã thu hồi refresh token MỌI thiết bị (kể cả máy này) → chủ động đăng xuất
      await signOut();
      router.replace({ pathname: "/login", params: { passwordChanged: "1" } });
    },
    onError: (e) => {
      if (e.code === ERROR_CODES.WRONG_PASSWORD)
        return setError("oldPassword", { message: e.message });
      if (e.code === ERROR_CODES.NEW_PASSWORD_SAME_AS_OLD)
        return setError("newPassword", { message: e.message });
      setFormError(e.message); // PASSWORD_NOT_SET (tài khoản Google), mất mạng, lỗi khác
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    change.mutate(values);
  });

  return (
    <Screen
      scroll
      header={<AppHeader title="Đổi mật khẩu" onBack={goBack} />}
      footer={
        <Button
          title="Đổi mật khẩu"
          onPress={onSubmit}
          loading={change.isPending}
        />
      }
      contentStyle={styles.content}
    >
      <Controller
        control={control}
        name="oldPassword"
        render={({ field }) => (
          <TextField
            label="Mật khẩu hiện tại"
            required
            secure
            autoComplete="current-password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.oldPassword?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field }) => (
          <TextField
            label="Mật khẩu mới"
            required
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.newPassword?.message}
          />
        )}
      />

      <PasswordChecklist password={newPassword} currentPassword={oldPassword} />

      <Controller
        control={control}
        name="newPasswordRepeat"
        render={({ field }) => (
          <TextField
            label="Nhập lại mật khẩu mới"
            required
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.newPasswordRepeat?.message}
          />
        )}
      />

      <NoteBox>
        Đổi xong, bạn và mọi thiết bị đang đăng nhập sẽ phải đăng nhập lại bằng
        mật khẩu mới. Chưa nhớ mật khẩu hiện tại thì dùng "Quên mật khẩu" ở màn
        đăng nhập.
      </NoteBox>

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
});
