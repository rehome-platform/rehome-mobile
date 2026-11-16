import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Redirect, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NoteBox } from "@/components/ui/NoteBox";
import { OrgRegisterHeader } from "@/features/organization/components/OrgRegisterHeader";
import { orgRepresentativeSchema } from "@/features/organization/schemas";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

const EMPTY_REPRESENTATIVE = {
  fullName: "",
  position: "",
  phone: "",
  email: "",
};

// OA-02 · Người đại diện. (Mật khẩu đặt lúc tạo tài khoản tổ chức — không hỏi lại ở đây)
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

  // Tự lưu nháp mỗi lần gõ → vuốt Back về bước 1 rồi quay lại không mất dữ liệu (chỉ trong RAM)
  useEffect(() => {
    const sub = watch((values) => saveStep("representative", { ...values }));
    return () => sub.unsubscribe();
  }, [watch, saveStep]);

  // Vào thẳng bước 2 mà chưa có bước 1 (mở bằng link, app bị tải lại…) → về bước 1
  if (!info) return <Redirect href="/org/registration/info" />;

  const onSubmit = handleSubmit((values) => {
    saveStep("representative", values);
    router.push("/org/registration/documents");
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
