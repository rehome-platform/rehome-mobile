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
import { TimeField } from "@/components/ui/TimeField";
import { Checkbox } from "@/components/ui/Checkbox";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { NoteBox } from "@/components/ui/NoteBox";
import { OrgRegisterHeader } from "@/features/organization/components/OrgRegisterHeader";
import { WEEKDAYS } from "@/features/organization/constants";
import { orgLocationSchema } from "@/features/organization/schemas";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

// Điền sẵn từ bước 1: tên hiển thị, SĐT liên hệ. Giờ hành chính 08:00–17:00
const emptyLocation = (info) => ({
  useOfficeAddress: true,
  address: "",
  name: info?.displayName ?? "",
  days: [], // không chọn sẵn: bắt người dùng chủ động chọn
  openTime: "08:00",
  closeTime: "17:00",
  contactPhone: info?.contactPhone ?? "",
});

export default function OrgLocationScreen() {
  const info = useOrgRegisterStore((s) => s.info);
  const documents = useOrgRegisterStore((s) => s.documents);
  const saved = useOrgRegisterStore((s) => s.location);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orgLocationSchema),
    defaultValues: saved ?? emptyLocation(info),
  });
  const useOfficeAddress = watch("useOfficeAddress");

  // Tự lưu nháp (giống bước 2, 3)
  useEffect(() => {
    const sub = watch((values) => saveStep("location", { ...values }));
    return () => sub.unsubscribe();
  }, [watch, saveStep]);

  if (!info || !documents) return <Redirect href="/org/registration/info" />;

  const onSubmit = handleSubmit((values) => {
    saveStep("location", values);
    router.push("/org/registration/review");
  });

  return (
    <Screen
      scroll
      header={<OrgRegisterHeader step={3} />}
      footer={<Button title="Tiếp tục — Xem lại" onPress={onSubmit} />}
      contentStyle={styles.content}
    >
      <Text style={styles.desc}>
        Nơi người quyên góp mang đồ đến. Hiện trên hồ sơ công khai của tổ chức.
      </Text>

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Tên điểm nhận"
            required
            helper="VD: Kho Hạt Mầm Xanh — Quận 1"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />

      {/* ---- Địa chỉ ---- */}
      <View style={styles.group}>
        <Controller
          control={control}
          name="useOfficeAddress"
          render={({ field }) => (
            <Checkbox checked={field.value} onChange={field.onChange}>
              Nhận đồ tại địa chỉ trụ sở
            </Checkbox>
          )}
        />
        {useOfficeAddress ? (
          <View style={styles.readonly}>
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.readonlyText}>{info.address}</Text>
          </View>
        ) : (
          <Controller
            control={control}
            name="address"
            render={({ field }) => (
              <TextField
                label="Địa chỉ nhận đồ"
                required
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.address?.message}
              />
            )}
          />
        )}
      </View>

      {/* ---- Ngày nhận ---- */}
      <Controller
        control={control}
        name="days"
        render={({ field }) => (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>
              Ngày nhận đồ trong tuần<Text style={styles.required}> *</Text>
            </Text>
            <ChipGroup
              multiple
              options={WEEKDAYS}
              value={field.value}
              onChange={field.onChange}
              error={errors.days?.message}
            />
          </View>
        )}
      />

      {/* ---- Khung giờ ---- */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>
          Khung giờ nhận<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.timeRow}>
          <Controller
            control={control}
            name="openTime"
            render={({ field }) => (
              <TimeField
                label="Từ"
                value={field.value}
                onChange={field.onChange}
                error={errors.openTime?.message}
                style={styles.time}
              />
            )}
          />
          <Controller
            control={control}
            name="closeTime"
            render={({ field }) => (
              <TimeField
                label="Đến"
                value={field.value}
                onChange={field.onChange}
                error={errors.closeTime?.message}
                style={styles.time}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="contactPhone"
        render={({ field }) => (
          <TextField
            label="Số điện thoại tại điểm nhận"
            keyboardType="phone-pad"
            maxLength={14}
            helper="Người quyên góp gọi khi đến nơi. Để trống nếu dùng SĐT liên hệ"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.contactPhone?.message}
          />
        )}
      />

      <NoteBox>
        <Text style={styles.noteText}>
          Mỗi tổ chức có <Text style={styles.bold}>một</Text> điểm nhận. Sau khi
          được xác minh, bạn sửa được địa chỉ và giờ nhận mà không cần duyệt
          lại.
        </Text>
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  desc: { ...textStyles.body, color: colors.textSecondary },
  group: { gap: spacing.sm },
  groupLabel: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  readonly: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral, // nền xám: chỉ đọc, sửa ở bước 1
  },
  readonlyText: { flex: 1, ...textStyles.body, color: colors.text },
  timeRow: { flexDirection: "row", gap: spacing.md },
  time: { flex: 1 },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
