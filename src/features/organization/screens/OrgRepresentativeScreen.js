import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NoteBox } from "@/components/ui/NoteBox";
import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { OrgRegisterHeader } from "@/features/organization/components/OrgRegisterHeader";
import { orgRepresentativeSchema } from "@/features/organization/schemas";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

const EMPTY_REPRESENTATIVE = {
  fullName: "",
  position: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function OrgRepresentativeScreen() {
  const info = useOrgRegisterStore((s) => s.info);
  const saved = useOrgRegisterStore((s) => s.representative);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orgRepresentativeSchema),
    defaultValues: saved ?? EMPTY_REPRESENTATIVE,
  });
  const password = watch("password");

  // Tự lưu nháp mỗi lần gõ → vuốt Back về bước 1 rồi quay lại không mất dữ liệu.
  // Chỉ lưu trong RAM; thoát luồng thì reset() xoá hết (kể cả mật khẩu)
  useEffect(() => {
    const sub = watch((values) => saveStep("representative", { ...values }));
    return () => sub.unsubscribe();
  }, [watch, saveStep]);

  // Vào thẳng bước 2 mà chưa có bước 1 (mở bằng link, app bị tải lại…) → về bước 1
  if (!info) return <Redirect href="/org-register/info" />;

  const onSubmit = handleSubmit((values) => {
    saveStep("representative", values);
    router.push("/org-register/documents");
  });

  return (
    <Screen
      scroll
      header={<OrgRegisterHeader step={1} />}
      footer={<Button title="Tiếp tục — Giấy tờ" onPress={onSubmit} />}
      contentStyle={styles.content}
    >
      <NoteBox>
        <Text style={styles.noteText}>
          Người đại diện theo pháp luật hoặc người được uỷ quyền.{" "}
          <Text style={styles.bold}>Họ tên phải khớp với CCCD</Text> bạn tải lên
          ở bước 3.
        </Text>
      </NoteBox>

      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Họ và tên"
            required
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="position"
        render={({ field }) => (
          <TextField
            label="Chức vụ"
            required
            placeholder="Chủ tịch, Giám đốc, Trưởng ban…"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.position?.message}
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
            maxLength={12}
            helper="Số di động của người đại diện, Moderator có thể gọi để xác minh"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />

      {/* ---- Tài khoản đăng nhập ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản đăng nhập</Text>
        <Text style={styles.desc}>
          Tổ chức đăng nhập ReHome bằng email liên hệ ở bước 1 và mật khẩu dưới
          đây.
        </Text>
      </View>

      <View style={styles.loginEmail}>
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.emailText} numberOfLines={1}>
          {info.contactEmail}
        </Text>
        <Text
          style={styles.link}
          onPress={() => router.back()}
          accessibilityRole="link"
        >
          Sửa
        </Text>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu"
            required
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <PasswordChecklist password={password} />

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  loginEmail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral, // nền xám: ô chỉ đọc, không gõ được
  },
  emailText: { flex: 1, ...textStyles.body, fontSize: 16, color: colors.text },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
