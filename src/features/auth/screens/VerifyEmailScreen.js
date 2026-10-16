import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { OTP_PURPOSE } from "@/constants/auth";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60; // BE: phải cách 60 giây giữa 2 lần gửi mã

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/login");

export default function VerifyEmailScreen() {
  // email: bắt buộc; reason = "unverified" khi mở từ AU-02 (đăng nhập tài khoản chưa xác thực)
  const { email: rawEmail, reason } = useLocalSearchParams();
  const email = typeof rawEmail === "string" ? rawEmail : "";

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null); // lỗi mã → hiện ngay dưới 6 ô
  const [formError, setFormError] = useState(null); // lỗi khác → khung lỗi
  const [notice, setNotice] = useState(null); // "Đã gửi mã mới…"
  const countdown = useCountdown(RESEND_SECONDS);

  const verify = useMutation({
    mutationFn: () => authApi.verifyRegisterOtp({ email, otp }),
    // BE không trả token → về Đăng nhập, điền sẵn email. dismissTo bỏ AU-03/AU-04 khỏi lịch sử
    onSuccess: () =>
      router.dismissTo({
        pathname: "/login",
        params: { email, verified: "1" },
      }),
    onError: (e) => {
      // BE trả CÙNG một lỗi 400 cho mã sai / hết hạn / đã dùng / sai quá 5 lần → hiện nguyên message
      if (e.status === 400) return setOtpError(e.message);
      setFormError(e.message);
    },
  });

  const resend = useMutation({
    mutationFn: () =>
      authApi.resendOtp({ email, purpose: OTP_PURPOSE.REGISTER }),
    onSuccess: () => {
      setOtp("");
      setOtpError(null);
      setNotice("Đã gửi mã mới. Mã cũ không dùng được nữa.");
      countdown.restart();
    },
    onError: (e) => setFormError(e.message), // 429: gửi lại quá sớm
  });

  const onChangeOtp = (value) => {
    setOtp(value);
    setOtpError(null); // gõ lại thì xoá lỗi cũ
    setFormError(null);
  };

  const onResend = () => {
    setFormError(null);
    setNotice(null);
    resend.mutate();
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Xác thực email" onBack={goBack} />}
      footer={
        <Button
          title="Xác nhận"
          onPress={() => verify.mutate()}
          loading={verify.isPending}
          disabled={otp.length < OTP_LENGTH} // màn OTP: khoá nút tới khi đủ 6 số (đã chốt)
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.intro}>
        <Text style={styles.title}>Nhập mã 6 số</Text>
        <Text style={styles.desc}>
          {reason === "unverified"
            ? "Tài khoản chưa xác thực email. Mình đã gửi mã mới tới "
            : "Mình vừa gửi mã tới "}
          <Text style={styles.bold}>{email}</Text>. Kiểm tra cả mục Spam nếu
          chưa thấy.
        </Text>
      </View>

      <View style={styles.otpGroup}>
        <OtpInput
          value={otp}
          onChange={onChangeOtp}
          length={OTP_LENGTH}
          error={!!otpError}
        />
        {otpError ? (
          <Text style={styles.error}>{otpError}</Text>
        ) : (
          <Text style={styles.caption}>Mã có hiệu lực 5 phút.</Text>
        )}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.center}>
        {countdown.left > 0 ? (
          <Text style={styles.caption}>
            Gửi lại mã sau{" "}
            <Text style={styles.bold}>{formatCountdown(countdown.left)}</Text>
          </Text>
        ) : (
          <Button
            title="Gửi lại mã"
            variant="text"
            onPress={onResend}
            loading={resend.isPending}
          />
        )}
        <Text style={styles.link} onPress={goBack} accessibilityRole="link">
          Nhập sai email? Quay lại sửa
        </Text>
      </View>

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  title: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  otpGroup: { gap: spacing.sm },
  caption: { ...textStyles.body, color: colors.textSecondary },
  error: { ...textStyles.body, fontFamily: fonts.medium, color: colors.error },
  notice: {
    ...textStyles.body,
    fontFamily: fonts.medium,
    color: colors.success,
  },
  center: { alignItems: "center", gap: spacing.sm },
  link: {
    ...textStyles.body,
    color: colors.accent,
    textDecorationLine: "underline",
  },
});
