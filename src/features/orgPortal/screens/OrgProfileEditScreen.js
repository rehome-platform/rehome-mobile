import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { TextField } from "@/components/ui/TextField";
import { TimeField } from "@/components/ui/TimeField";
import { showToast } from "@/utils/toast";
import { ORG_LIMITS } from "@/constants/community";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { uploadFile } from "@/lib/api/upload";
import { useAuthStore } from "@/stores/authStore";
import { WEEKDAYS } from "@/features/organization/constants";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { orgProfileEditSchema } from "@/features/organization/schemas";
import {
  orgKeys,
  useMyOrganization,
} from "@/features/organization/hooks/useMyOrganization";
import {
  formatReceivingHours,
  parseReceivingHours,
} from "@/features/organization/utils/summary";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/org/profile");
const isRemote = (uri) => /^https?:\/\//.test(uri ?? "");

const toForm = (p) => ({
  logoUri: p.logoUrl ?? null,
  displayName: p.displayName ?? "",
  description: p.description ?? "",
  contactPhone: p.contactPhone ?? "",
  ...(parseReceivingHours(p.donationPointReceivingHours) ?? {
    days: [],
    openTime: "08:00",
    closeTime: "17:00",
  }),
});

// Ảnh mới trong máy → upload ORGANIZATION_LOGOS; logo cũ (URL) giữ nguyên → PATCH /api/organizations/me
async function saveProfile(values) {
  const logoUrl =
    !values.logoUri || isRemote(values.logoUri)
      ? values.logoUri
      : (
          await uploadFile(
            { uri: values.logoUri, name: "logo.jpg", mimeType: "image/jpeg" },
            UPLOAD_FOLDER.ORGANIZATION_LOGOS,
          )
        ).url;
  return organizationApi.updateMyProfile({
    logoUrl,
    displayName: values.displayName.trim(),
    description: values.description.trim(),
    contactPhone: values.contactPhone,
    donationPointReceivingHours: formatReceivingHours(values),
  });
}

function EditForm({ profile }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, submitCount },
  } = useForm({
    resolver: zodResolver(orgProfileEditSchema),
    defaultValues: toForm(profile),
  });
  const [logoUri, description] = useWatch({
    control,
    name: ["logoUri", "description"],
  });
  const hasErrors = submitCount > 0 && Object.keys(errors).length > 0;

  const save = useMutation({
    mutationFn: saveProfile,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.me });
      setUser({ ...user, ...res }); // logo / mô tả mới hiện ngay ở nơi khác dùng authStore
      showToast("Đã lưu thay đổi");
      leave();
    },
  });

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled)
      setValue("logoUri", result.assets[0].uri, { shouldDirty: true });
  };

  const onBack = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ thay đổi?", "Những gì bạn vừa sửa sẽ không được lưu.", [
      { text: "Sửa tiếp", style: "cancel" },
      { text: "Bỏ thay đổi", style: "destructive", onPress: leave },
    ]);
  };

  return (
    <Screen
      scroll
      header={
        <AppHeader
          title="Sửa thông tin thường"
          onBack={onBack}
          right={
            hasErrors ? (
              <Text style={styles.errorBadge}>Có lỗi, kiểm tra lại</Text>
            ) : null
          }
        />
      }
      footer={
        <Button
          title="Lưu thay đổi"
          onPress={handleSubmit((values) => save.mutate(values))}
          loading={save.isPending}
          disabled={!isDirty}
        />
      }
      contentStyle={styles.content}
    >
      {save.isError ? <ErrorBox message={save.error.message} /> : null}

      <View style={styles.logoRow}>
        <Avatar
          uri={logoUri}
          name={profile.displayName}
          size={72}
          initialOf="first"
        />
        <Button
          title="Đổi ảnh đại diện"
          variant="secondary"
          onPress={pickLogo}
        />
      </View>

      <Controller
        control={control}
        name="displayName"
        render={({ field }) => (
          <TextField
            label="Tên hiển thị"
            required
            maxLength={100}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            helper="Tên hiện trên Cộng đồng. Tên pháp lý đổi ở mục Đổi pháp lý."
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Mô tả"
            required
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            helper={`${(description ?? "").length} / ${ORG_LIMITS.DESCRIPTION_MAX}`}
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="contactPhone"
        render={({ field }) => (
          <TextField
            label="Số điện thoại"
            required
            keyboardType="phone-pad"
            maxLength={14}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.contactPhone?.message}
          />
        )}
      />

      <View style={styles.group}>
        <Text style={styles.label}>
          Giờ nhận đồ<Text style={styles.required}> *</Text>
        </Text>
        <Controller
          control={control}
          name="days"
          render={({ field }) => (
            <ChipGroup
              multiple
              options={WEEKDAYS}
              value={field.value}
              onChange={field.onChange}
              error={errors.days?.message}
            />
          )}
        />
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
                style={styles.flex}
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
                style={styles.flex}
              />
            )}
          />
        </View>
      </View>

      <NoteBox>
        <Text style={styles.note}>
          Thông tin thường —{" "}
          <Text style={styles.bold}>sửa xong áp dụng ngay</Text>, không cần
          Moderator duyệt. Địa điểm nhận đồ nằm trong giờ nhận đồ ở trên, không
          tách riêng (một tổ chức một địa điểm).
        </Text>
      </NoteBox>
    </Screen>
  );
}

// OP-02 · Sửa thông tin thường: logo, tên hiển thị, mô tả (≤ 300), SĐT, giờ nhận đồ — áp dụng ngay (PATCH /me).
// Form chỉ dựng khi đã có hồ sơ (defaultValues của useForm chỉ đọc lần đầu)
export default function OrgProfileEditScreen() {
  const me = useMyOrganization();
  if (me.data) return <EditForm profile={me.data} />;
  return (
    <Screen header={<AppHeader title="Sửa thông tin thường" onBack={leave} />}>
      {me.isError ? (
        <ErrorBox message={me.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => me.refetch()}
          />
        </ErrorBox>
      ) : (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  content: { gap: spacing.lg },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  group: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  timeRow: { flexDirection: "row", gap: spacing.md },
  note: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  errorBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
