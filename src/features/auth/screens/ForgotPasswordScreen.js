import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { forgotPasswordSchema } from "@/features/auth/schemas";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/login");

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams(); // { email } — điền sẵn từ AU-02 nếu đã gõ
  const [formError, setFormError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: typeof params.email === "string" ? params.email : "",
    },
  });

  const send = useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword({ email }), // gửi OTP "đặt lại mật khẩu" (resend-otp FORGOT_PASSWORD)
    // BE luôn trả như nhau dù email có tồn tại hay không (chống dò tài khoản) → luôn sang AU-06
    onSuccess: (_data, { email }) =>
      router.push({ pathname: "/reset-password", params: { email } }),
    onError: (e) => setFormError(e.message), // mất mạng, lỗi server
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    send.mutate(values);
  });

  return (
    <Screen
      scroll
      header={<AppHeader title="Quên mật khẩu" onBack={goBack} />}
      footer={
        <Button title="Gửi mã" onPress={onSubmit} loading={send.isPending} />
      }
      contentStyle={styles.content}
    >
      <View style={styles.intro}>
        <Text style={styles.title}>Nhập email đã đăng ký</Text>
        <Text style={styles.desc}>
          Mình sẽ gửi một mã 6 số tới email này để bạn đặt mật khẩu mới. Mã có
          hiệu lực 5 phút.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            required
            placeholder="ban@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  title: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
});
