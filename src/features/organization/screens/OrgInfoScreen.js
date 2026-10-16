import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { RadioCard } from "@/components/ui/RadioCard";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Avatar } from "@/components/ui/Avatar";
import { OrgRegisterHeader } from "@/features/organization/components/OrgRegisterHeader";
import { OPERATION_SCOPES, ORG_TYPES } from "@/features/organization/constants";
import { orgInfoSchema } from "@/features/organization/schemas";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

const EMPTY_INFO = {
  legalName: "",
  displayName: "",
  orgType: "",
  taxCode: "",
  operationScope: "", // không chọn sẵn: bắt người dùng chủ động chọn
  address: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
  description: "",
  logoUri: null,
};

export default function OrgInfoScreen() {
  const saved = useOrgRegisterStore((s) => s.info);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);
  const reset = useOrgRegisterStore((s) => s.reset);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(orgInfoSchema),
    defaultValues: saved ?? EMPTY_INFO, // quay lại từ bước 2 → hiện lại dữ liệu đã nhập
  });

  const logoUri = watch("logoUri");
  const displayName = watch("displayName");

  // Thoát luồng: xoá dữ liệu tạm. Đã nhập gì thì hỏi trước
  const exit = () => {
    reset();
    router.canGoBack() ? router.back() : router.replace("/register");
  };
  const onBack = () => {
    if (!isDirty && !saved) return exit();
    Alert.alert(
      "Thoát đăng ký tổ chức?",
      "Thông tin bạn đã nhập sẽ không được lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Thoát", style: "destructive", onPress: exit },
      ],
    );
  };

  // Logo: chọn ảnh vuông trong máy. Upload khi gửi hồ sơ [CHỜ BE /uploads]
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

  const onSubmit = handleSubmit((values) => {
    saveStep("info", values);
    router.push("/org-register/representative");
  });

  return (
    <Screen
      scroll
      header={<OrgRegisterHeader step={0} onBack={onBack} />}
      footer={<Button title="Tiếp tục — Người đại diện" onPress={onSubmit} />}
      contentStyle={styles.content}
    >
      <Controller
        control={control}
        name="legalName"
        render={({ field }) => (
          <TextField
            label="Tên đầy đủ theo giấy tờ"
            required
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.legalName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="displayName"
        render={({ field }) => (
          <TextField
            label="Tên hiển thị trên nền tảng"
            required
            helper="Tên người dùng nhìn thấy, có thể ngắn gọn hơn"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="orgType"
        render={({ field }) => (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>
              Loại hình tổ chức<Text style={styles.required}> *</Text>
            </Text>
            {ORG_TYPES.map((type) => (
              <RadioCard
                key={type.value}
                title={type.label}
                selected={field.value === type.value}
                onPress={() => field.onChange(type.value)}
                style={styles.radio}
              />
            ))}
            {errors.orgType ? (
              <Text style={styles.error}>{errors.orgType.message}</Text>
            ) : (
              <Text style={styles.helper}>
                Quyết định danh sách giấy tờ gợi ý ở bước 3
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="taxCode"
        render={({ field }) => (
          <TextField
            label="Mã số thuế"
            helper="Không bắt buộc — câu lạc bộ thường chưa có"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.taxCode?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="operationScope"
        render={({ field }) => (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>
              Phạm vi hoạt động<Text style={styles.required}> *</Text>
            </Text>
            <ChipGroup
              options={OPERATION_SCOPES}
              value={field.value}
              onChange={field.onChange}
              error={errors.operationScope?.message}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <TextField
            label="Địa chỉ trụ sở"
            required
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.address?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="contactPhone"
        render={({ field }) => (
          <TextField
            label="Số điện thoại liên hệ"
            required
            keyboardType="phone-pad"
            maxLength={14}
            helper="Moderator gọi số này để xác minh — nhớ bắt máy"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.contactPhone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="contactEmail"
        render={({ field }) => (
          <TextField
            label="Email liên hệ"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            helper="Dùng để đăng nhập và nhận thông báo của ReHome"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.contactEmail?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="website"
        render={({ field }) => (
          <TextField
            label="Website hoặc fanpage"
            keyboardType="url"
            autoCapitalize="none"
            placeholder="facebook.com/tentochuc"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Mô tả hoạt động"
            required
            multiline
            maxLength={1000}
            helper="Hiện trên hồ sơ công khai của tổ chức"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.description?.message}
          />
        )}
      />

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Logo</Text>
        <View style={styles.logoRow}>
          <Avatar
            uri={logoUri}
            name={displayName || "?"}
            size={64}
            initialOf="first"
          />
          <View style={styles.logoActions}>
            <Button
              title={logoUri ? "Đổi logo" : "Chọn logo"}
              variant="secondary"
              onPress={pickLogo}
            />
            {logoUri ? (
              <Button
                title="Xoá logo"
                variant="text"
                onPress={() => setValue("logoUri", null, { shouldDirty: true })}
              />
            ) : null}
          </View>
        </View>
        <Text style={styles.helper}>
          Không bắt buộc. Chưa có thì hiện chữ cái đầu của tên tổ chức.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupLabel: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  radio: { flex: 0 }, // RadioCard mặc định flex:1 (dùng trong hàng ngang) → trong cột thì bỏ
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  logoActions: { flex: 1, gap: spacing.xs },
});
