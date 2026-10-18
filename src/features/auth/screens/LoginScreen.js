import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Divider } from "@/components/ui/Divider";
import { authApi } from "@/features/auth/api/authApi";
import { loginSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/stores/authStore";
import { ERROR_CODES } from "@/constants/errorCodes";
import { OTP_PURPOSE } from "@/constants/auth";
import { GOOGLE_AVAILABLE, getGoogleIdToken } from "@/features/auth/google";

const logo = require("../../../../assets/logo/logoIcon.png"); // assets nằm ngoài src nên không dùng @/
// Thông báo xanh khi quay về từ màn khác (param = "1")
const NOTICES = {
  verified: "Xác thực email thành công, mời bạn đăng nhập.",
  passwordChanged: "Đổi mật khẩu thành công, mời bạn đăng nhập lại.",
  passwordReset:
    "Đặt lại mật khẩu thành công, mời bạn đăng nhập bằng mật khẩu mới.",
};

export default function LoginScreen() {
  const params = useLocalSearchParams(); // { email } khi quay về từ AU-04 (điền sẵn)
  const noticeKey = Object.keys(NOTICES).find((key) => params[key] === "1");
  const signIn = useAuthStore((s) => s.signIn);
  const sessionError = useAuthStore((s) => s.sessionError); // bị đăng xuất vì khoá khi đang dùng app
  const clearSessionError = useAuthStore((s) => s.clearSessionError);
  const [formError, setFormError] = useState(null); // ApiError hiện ở khung trên nút Đăng nhập

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: typeof params.email === "string" ? params.email : "",
      password: "",
    },
  });

  // Quay về từ AU-04 (router.dismissTo) → màn này đã mở sẵn nên defaultValues không chạy lại
  // → tự điền email vừa xác thực khi params.email thay đổi
  useEffect(() => {
    if (typeof params.email === "string") setValue("email", params.email);
  }, [params.email, setValue]);

  // Gửi lại OTP rồi sang AU-04. Resend lỗi (vd 429 vừa gửi) vẫn chuyển màn
  const goVerify = async (email) => {
    try {
      await authApi.resendOtp({ email, purpose: OTP_PURPOSE.REGISTER });
    } catch {}
    router.push({
      pathname: "/verify-email",
      params: { email, reason: "unverified" },
    });
  };

  const login = useMutation({
    // Thành công → store chuyển sang authenticated → nhóm (auth) bị khoá → tự sang (member)
    mutationFn: async (values) => signIn(await authApi.login(values)),
    onError: (e, values) => {
      if (e.code === ERROR_CODES.EMAIL_NOT_VERIFIED)
        return goVerify(values.email); // [CHỜ BE] code
      if (e.status === 401) return setError("password", { message: e.message }); // sai email/mật khẩu → dưới ô
      setFormError(e); // 403, mất mạng, lỗi khác → khung lỗi
    },
  });
  // Google: chọn tài khoản → idToken → BE → signIn (giống login). Huỷ chọn → không làm gì
  const google = useMutation({
    mutationFn: async () => {
      const idToken = await getGoogleIdToken();
      if (!idToken) return; // huỷ chọn tài khoản → không làm gì
      await signIn(await authApi.loginWithGoogle({ idToken }));
    },

    onError: (e) => setFormError(e), // ACCOUNT_BANNED, GOOGLE_ACCOUNT_CONFLICT, mất mạng… → khung lỗi
  });

  const onGoogle = () => {
    if (!GOOGLE_AVAILABLE) {
      return Alert.alert(
        "Đăng nhập bằng Google",
        "Cần bản cài đặt ReHome (dev build). Expo Go không hỗ trợ đăng nhập Google.",
      );
    }
    setFormError(null);
    clearSessionError();
    google.mutate();
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    clearSessionError();
    login.mutate(values);
  });

  const shownError = formError ?? sessionError;
  const isBanned = shownError?.code === ERROR_CODES.ACCOUNT_BANNED;
  const showResend =
    shownError?.status === 403 && shownError?.code === "HTTP_403"; // [TẠM] BE chưa có code

  return (
    <Screen
      scroll
      header={<AppHeader title="Đăng nhập" />}
      footer={
        <Text style={styles.footerText}>
          Chưa có tài khoản?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/register")}
            accessibilityRole="link"
          >
            Đăng ký
          </Text>
        </Text>
      }
      contentStyle={styles.content}
    >
      <View style={styles.brand}>
        <Image
          source={logo}
          style={styles.logo}
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.brandName}>ReHome</Text>
        <Text style={styles.tagline}>
          Ký gửi, mua đồ cũ có kiểm định{"\n"}và quyên góp cho tổ chức từ thiện
        </Text>
      </View>

      {noticeKey ? (
        <Text style={styles.success}>{NOTICES[noticeKey]}</Text>
      ) : null}

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

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu"
            required
            secure
            autoComplete="password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Button
        title="Quên mật khẩu?"
        variant="text"
        onPress={() =>
          router.push({
            pathname: "/forgot-password",
            params: { email: getValues("email").trim() },
          })
        }
        style={styles.forgot}
      />

      {shownError ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Text style={styles.errorTitle}>
            {isBanned ? "Tài khoản của bạn đã bị khoá." : shownError.message}
          </Text>
          {isBanned && shownError.reason ? (
            <Text style={styles.errorText}>Lý do: {shownError.reason}</Text>
          ) : null}
          {isBanned ? (
            <Text style={styles.errorText}>
              Cần hỗ trợ? Liên hệ email hỗ trợ ReHome.
            </Text>
          ) : null}
          {showResend ? (
            <Pressable
              onPress={() => goVerify(getValues("email").trim())}
              hitSlop={8}
              accessibilityRole="link"
            >
              <Text style={styles.link}>Chưa xác thực email? Gửi lại mã</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Button title="Đăng nhập" onPress={onSubmit} loading={login.isPending} />
      <Divider label="hoặc" />
      <Button
        title="Đăng nhập bằng Google"
        variant="secondary"
        onPress={onGoogle}
        loading={google.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  brand: { alignItems: "center", gap: spacing.sm, marginVertical: spacing.lg },
  logo: { width: 72, height: 72 },
  brandName: { ...textStyles.title, color: colors.text },
  tagline: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  forgot: {
    alignSelf: "flex-end",
    paddingHorizontal: 0,
    marginTop: -spacing.sm,
  },
  errorBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  errorTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  errorText: { ...textStyles.body, color: colors.text },
  success: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.success,
    textAlign: "center",
  },

  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center", // căn giữa cả câu (thay cho justifyContent của View cũ)
    paddingVertical: spacing.xs, // nới vùng bấm, vì Text lồng không dùng được hitSlop
  },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textDecorationLine: "underline",
  },
});
