import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { RadioCard } from "@/components/ui/RadioCard";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { showToast } from "@/utils/toast";

const METHOD = { OTP: "OTP", LINK: "LINK" };
const RESEND_SECONDS = 60; // BE không gửi lại trong 60 giây

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/login");

// AU-05 · Quên mật khẩu — 2 cách:
// OTP: mã 6 số → AU-06 nhập mã + mật khẩu mới ngay trong app
// LINK: BE gửi link qua email → đặt mật khẩu mới trên trang web → quay lại đăng nhập
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams(); // { email } — điền sẵn từ AU-02 nếu đã gõ
  const [method, setMethod] = useState(METHOD.OTP);
  const [formError, setFormError] = useState(null);
  const [linkSentTo, setLinkSentTo] = useState(null); // email vừa gửi link → màn "Kiểm tra email"
  const [cooldown, setCooldown] = useState(0);

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

  // Đếm ngược nút "Gửi lại link"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // BE luôn trả như nhau dù email có tồn tại hay không (chống dò tài khoản) → luôn coi là đã gửi
  const sendOtp = useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword({ email }),
    onSuccess: (_data, { email }) =>
      router.push({ pathname: "/reset-password", params: { email } }),
    onError: (e) => setFormError(e.message),
  });

  const sendLink = useMutation({
    mutationFn: ({ email }) => authApi.forgotPasswordByLink({ email }),
    onSuccess: (_data, { email }) => {
      if (linkSentTo) showToast("Đã gửi lại link");
      setLinkSentTo(email);
      setCooldown(RESEND_SECONDS);
    },
    onError: (e) => setFormError(e.message),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    (method === METHOD.OTP ? sendOtp : sendLink).mutate(values);
  });

  if (linkSentTo) {
    return (
      <Screen
        scroll
        header={<AppHeader title="Quên mật khẩu" onBack={goBack} />}
        footer={
          <View style={styles.footer}>
            <Button
              title="Về đăng nhập"
              onPress={() =>
                router.dismissTo({
                  pathname: "/login",
                  params: { email: linkSentTo },
                })
              }
            />
            <Button
              title={
                cooldown > 0 ? `Gửi lại link (${cooldown}s)` : "Gửi lại link"
              }
              variant="secondary"
              disabled={cooldown > 0}
              loading={sendLink.isPending}
              onPress={() => sendLink.mutate({ email: linkSentTo })}
            />
          </View>
        }
        contentStyle={styles.content}
      >
        <View style={styles.sent}>
          <Ionicons
            name="mail-unread-outline"
            size={56}
            color={colors.primary}
          />
          <Text style={[styles.title, styles.center]}>
            Kiểm tra email của bạn
          </Text>
          <Text style={[styles.desc, styles.center]}>
            Nếu <Text style={styles.bold}>{linkSentTo}</Text> đã đăng ký ReHome,
            mình vừa gửi một đường link đặt lại mật khẩu tới email này.
          </Text>
        </View>
        <NoteBox>
          Mở email, bấm link để đặt mật khẩu mới trên trang ReHome, rồi quay lại
          đây đăng nhập. Không thấy email? Xem thư mục Spam / Quảng cáo, hoặc
          gửi lại sau 60 giây.
        </NoteBox>
        <ErrorBox message={formError} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      header={<AppHeader title="Quên mật khẩu" onBack={goBack} />}
      footer={
        <Button
          title={method === METHOD.OTP ? "Gửi mã" : "Gửi link đặt lại"}
          onPress={onSubmit}
          loading={sendOtp.isPending || sendLink.isPending}
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.intro}>
        <Text style={styles.title}>Nhập email đã đăng ký</Text>
        <Text style={styles.desc}>Chọn cách bạn muốn đặt lại mật khẩu.</Text>
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

      <View style={styles.methods}>
        <RadioCard
          title="Nhận mã OTP"
          description="Mã 6 số gửi tới email, đặt mật khẩu mới ngay trong app. Mã có hiệu lực 5 phút."
          selected={method === METHOD.OTP}
          onPress={() => setMethod(METHOD.OTP)}
        />
        <RadioCard
          title="Nhận link qua email"
          description="Bấm link trong email để đặt mật khẩu mới trên trang web ReHome."
          selected={method === METHOD.LINK}
          onPress={() => setMethod(METHOD.LINK)}
        />
      </View>

      <NoteBox>
        Chỉ mã hoặc link gửi sau cùng mới dùng được. Nếu đã gửi cả hai, hãy dùng
        cái mới nhất.
      </NoteBox>

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  methods: { gap: spacing.sm },
  sent: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg },
  title: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  center: { textAlign: "center" },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  footer: { gap: spacing.sm },
});
