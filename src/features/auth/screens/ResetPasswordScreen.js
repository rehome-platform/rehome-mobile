import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";

const RESEND_SECONDS = 60; // BE: phải cách 60 giây giữa 2 lần gửi mã
const goBack = () => (router.canGoBack() ? router.back() : router.replace("/login"));

export default function ResetPasswordScreen() {
  const { email: rawEmail } = useLocalSearchParams();
  const email = typeof rawEmail === "string" ? rawEmail : "";

  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const countdown = useCountdown(RESEND_SECONDS);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });
  const newPassword = watch("newPassword");

  const reset = useMutation({
    mutationFn: async ({ otp, newPassword, confirmPassword }) => {
      // Bước 1: kiểm mã → nhận resetToken. Lỗi ở bước này thì đánh dấu để hiện dưới ô mã
      let resetToken;
      try {
        ({ resetToken } = await authApi.verifyResetOtp({ email, otp }));
      } catch (e) {
        e.field = "otp";
        throw e;
      }
      // Bước 2: đặt mật khẩu mới bằng resetToken
      return authApi.resetPassword({ email, resetToken, newPassword, confirmPassword });
    },
    // Về Đăng nhập (bỏ AU-05/AU-06 khỏi lịch sử), điền sẵn email + báo thành công
    onSuccess: () => router.dismissTo({ pathname: "/login", params: { email, passwordReset: "1" } }),
    onError: (e) => {
      // BE trả CÙNG một lỗi 400 cho mã sai / hết hạn / đã dùng → hiện dưới 6 ô
      if (e.field === "otp" && e.status === 400) return setError("otp", { message: e.message });
      setFormError(e.message);
    },
  });

  const resend = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => {
      setValue("otp", "");
      clearErrors("otp");
      setNotice("Đã gửi mã mới. Mã cũ không dùng được nữa.");
      countdown.restart();
    },
    onError: (e) => setFormError(e.message), // 429: gửi lại quá sớm
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setNotice(null);
    reset.mutate(values);
  });

  const onResend = () => {
    setFormError(null);
    setNotice(null);
    resend.mutate();
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Đặt mật khẩu mới" onBack={goBack} />}
      footer={<Button title="Đặt mật khẩu" onPress={onSubmit} loading={reset.isPending} />}
      contentStyle={styles.content}
    >
      <Text style={styles.desc}>
        Nhập mã 6 số đã gửi tới <Text style={styles.bold}>{email}</Text> và đặt mật khẩu mới.
      </Text>

      <View style={styles.group}>
        <Text style={styles.label}>Mã xác thực</Text>
        <Controller
          control={control}
          name="otp"
          render={({ field }) => (
            <OtpInput value={field.value} onChange={field.onChange} error={!!errors.otp} />
          )}
        />
        {errors.otp ? (
          <Text style={styles.error}>{errors.otp.message}</Text>
        ) : (
          <Text style={styles.caption}>Mã có hiệu lực 5 phút.</Text>
        )}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {countdown.left > 0 ? (
          <Text style={styles.caption}>
            Gửi lại mã sau <Text style={styles.bold}>{formatCountdown(countdown.left)}</Text>
          </Text>
        ) : (
          <Button
            title="Gửi lại mã"
            variant="text"
            onPress={onResend}
            loading={resend.isPending}
            style={styles.resend}
          />
        )}
      </View>

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

      <PasswordChecklist password={newPassword} />

      <Controller
        control={control}
        name="confirmPassword"
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
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <NoteBox>
        <Text style={styles.noteText}>
          Đặt xong, <Text style={styles.bold}>mọi thiết bị đang đăng nhập sẽ bị đăng xuất</Text> — phòng trường hợp mật
          khẩu cũ đã bị lộ. Mã chỉ dùng được một lần.
        </Text>
      </NoteBox>

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  desc: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  group: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  caption: { ...textStyles.body, color: colors.textSecondary },
  error: { ...textStyles.body, fontFamily: fonts.medium, color: colors.error },
  notice: { ...textStyles.body, fontFamily: fonts.medium, color: colors.success },
  resend: { alignSelf: "flex-start", paddingHorizontal: 0 },
  noteText: { ...textStyles.body, color: colors.textSecondary },
});
