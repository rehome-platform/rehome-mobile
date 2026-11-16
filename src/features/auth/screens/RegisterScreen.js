import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { RadioCard } from "@/components/ui/RadioCard";
import { Checkbox } from "@/components/ui/Checkbox";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ROLES } from "@/constants/roles";
import { authApi } from "@/features/auth/api/authApi";
import { registerSchema } from "@/features/auth/schemas";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/login");
// [GIẢ ĐỊNH] chưa có trang Điều khoản / Chính sách
const showSoon = () =>
  Alert.alert("Sắp có", "Nội dung điều khoản đang được hoàn thiện.");

// AU-03 · Đăng ký. Cá nhân → Member; Tổ chức → account ORGANIZATION (nộp hồ sơ SAU khi đăng nhập).
// Mở thẳng tab Tổ chức: /register?role=ORGANIZATION
export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const [role, setRole] = useState(
    params.role === ROLES.ORGANIZATION ? ROLES.ORGANIZATION : ROLES.MEMBER,
  );
  const isOrg = role === ROLES.ORGANIZATION;
  const [formError, setFormError] = useState(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  const signUp = useMutation({
    // Chỉ gửi field BE cần (không gửi confirmPassword, agree)
    mutationFn: ({ fullName, email, phone, password }) =>
      authApi.register({ fullName, email, phone, password, role }),
    onSuccess: (_data, values) => {
      // BE đã gửi OTP → sang AU-04. push (không replace) để "Nhập sai email? Quay lại sửa" quay về được
      router.push({
        pathname: "/verify-email",
        params: { email: values.email },
      });
    },
    onError: (e) => {
      if (e.status === 409) {
        return setError("email", {
          message: "Email này đã có tài khoản. Đăng nhập hoặc dùng email khác.",
        });
      }
      // [CHỜ BE] trùng SĐT hiện trả 500 kèm message kỹ thuật → hiện câu dễ hiểu
      if (e.status >= 500 && e.status !== 503) {
        return setFormError(
          "Không tạo được tài khoản. Nếu số điện thoại đã dùng cho tài khoản khác, hãy thử số khác.",
        );
      }
      setFormError(e.message); // 503 không gửi được mail, mất mạng, lỗi khác
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    signUp.mutate(values);
  });

  return (
    <Screen
      scroll
      header={<AppHeader title="Đăng ký tài khoản" onBack={goBack} />}
      footer={
        <Button
          title={isOrg ? "Tạo tài khoản tổ chức" : "Tạo tài khoản"}
          onPress={onSubmit}
          loading={signUp.isPending}
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Bạn đăng ký với tư cách</Text>
        <View style={styles.roles}>
          <RadioCard
            title="Cá nhân"
            description="Mua, ký gửi, quyên góp"
            selected={!isOrg}
            onPress={() => setRole(ROLES.MEMBER)}
          />
          <RadioCard
            title="Tổ chức"
            description="Nhận quyên góp, cần giấy tờ pháp lý"
            selected={isOrg}
            onPress={() => setRole(ROLES.ORGANIZATION)}
          />
        </View>
      </View>

      {isOrg ? (
        <NoteBox>
          Bước 1: tạo tài khoản và xác thực email. Bước 2: đăng nhập rồi nộp hồ
          sơ tổ chức (giấy tờ pháp lý, người đại diện, điểm nhận đồ) để ReHome
          xác minh.
        </NoteBox>
      ) : null}

      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label={isOrg ? "Họ tên người quản lý tài khoản" : "Họ và tên"}
            required
            helper={
              isOrg
                ? "Người đại diện hoặc nhân viên phụ trách. Tên tổ chức nhập ở bước nộp hồ sơ."
                : undefined
            }
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={isOrg ? "Email đăng nhập của tổ chức" : "Email"}
            required
            placeholder={isOrg ? "lienhe@tochuc.org" : "ban@example.com"}
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
        name="phone"
        render={({ field }) => (
          <TextField
            label={isOrg ? "Số điện thoại người quản lý" : "Số điện thoại"}
            required
            placeholder="0912 345 678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={13}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phone?.message}
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
            helper="Ít nhất 8 ký tự, có chữ và số"
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Nhập lại mật khẩu"
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

      <Controller
        control={control}
        name="agree"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            onChange={field.onChange}
            error={errors.agree?.message}
          >
            <Text style={styles.agreeText}>
              Tôi đồng ý với{" "}
              <Text
                style={styles.link}
                onPress={showSoon}
                accessibilityRole="link"
              >
                Điều khoản sử dụng
              </Text>{" "}
              và{" "}
              <Text
                style={styles.link}
                onPress={showSoon}
                accessibilityRole="link"
              >
                Chính sách bảo mật
              </Text>
            </Text>
          </Checkbox>
        )}
      />

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupLabel: { ...textStyles.label, fontSize: 14, color: colors.text },
  roles: { flexDirection: "row", gap: spacing.md },
  agreeText: { ...textStyles.body, color: colors.text },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textDecorationLine: "underline",
  },
});
