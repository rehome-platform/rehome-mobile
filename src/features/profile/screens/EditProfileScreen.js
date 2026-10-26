import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/api/upload";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { authApi } from "@/features/auth/api/authApi";
import { profileApi } from "@/features/profile/api/profileApi";
import { profileSchema } from "@/features/profile/schemas";
import { useAuthStore } from "@/stores/authStore";
import { queryClient } from "@/lib/query/queryClient";
import { formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/profile");

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [formError, setFormError] = useState(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      phone: formatPhone(user?.phone),
    },
  });

  const save = useMutation({
    mutationFn: async (values) => {
      await profileApi.updateMe(values);
      return authApi.getMe(); // response PATCH thiếu email/memberCode → lấy lại bản đầy đủ
    },
    onSuccess: (me) => {
      setUser(me); // PR-01 cập nhật ngay
      queryClient.setQueryData(["me"], me); // PR-02 cập nhật ngay, khỏi chờ tải lại
      showToast("Đã lưu thay đổi");
      leave();
    },
    onError: (e) => {
      // [CHỜ BE] trùng SĐT hiện trả 500 (BE chưa kiểm tra) → câu dễ hiểu, gắn vào ô SĐT
      if (e.status >= 500) {
        return setError("phone", {
          message:
            "Không lưu được. Số điện thoại có thể đã dùng cho tài khoản khác.",
        });
      }
      setFormError(e.message);
    },
  });
  // Đổi ảnh: chọn → upload AVATARS → PATCH CHỈ avatarUrl → lấy lại hồ sơ.
  // Lưu NGAY (như Facebook/Shopee), không chờ nút "Lưu thay đổi" của form tên / SĐT
  const avatar = useMutation({
    mutationFn: async (uri) => {
      const { url } = await uploadFile(
        { uri, name: "avatar.jpg", mimeType: "image/jpeg" },
        UPLOAD_FOLDER.AVATARS,
      );
      await profileApi.updateMe({ avatarUrl: url });
      return authApi.getMe();
    },
    onSuccess: (me) => {
      setUser(me); // PR-01, tab Cá nhân đổi ảnh ngay
      queryClient.setQueryData(["me"], me); // PR-02
      showToast("Đã đổi ảnh đại diện");
    },
    onError: (e) => Alert.alert("Chưa đổi được ảnh", e.message),
  });

  // Ảnh vuông (khung tròn), nén 0.7 cho nhẹ — BE nhận tối đa 10MB
  const pickAvatar = async (fromCamera) => {
    if (fromCamera) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted)
        return Alert.alert(
          "Chưa có quyền camera",
          "Bật quyền camera cho ReHome trong Cài đặt để chụp ảnh.",
        );
    }
    const options = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!res.canceled) avatar.mutate(res.assets[0].uri);
  };

  const changeAvatar = () =>
    Alert.alert("Đổi ảnh đại diện", undefined, [
      { text: "Chụp ảnh", onPress: () => pickAvatar(true) },
      { text: "Chọn từ thư viện", onPress: () => pickAvatar(false) },
      { text: "Huỷ", style: "cancel" },
    ]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    save.mutate(values);
  });

  // Đã sửa mà bấm Huỷ → hỏi trước khi bỏ
  const onCancel = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ thay đổi?", "Những gì bạn vừa sửa sẽ không được lưu.", [
      { text: "Sửa tiếp", style: "cancel" },
      { text: "Bỏ thay đổi", style: "destructive", onPress: leave },
    ]);
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Sửa hồ sơ" onBack={onCancel} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Huỷ"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
          <Button
            title="Lưu thay đổi"
            onPress={onSubmit}
            loading={save.isPending}
            disabled={!isDirty} // chưa sửa gì → không có gì để lưu (quyết định ②)
            style={styles.footerButton}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      <View style={styles.avatarBlock}>
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={80} />
        <Button
          title="Đổi ảnh đại diện"
          variant="text"
          onPress={changeAvatar}
          loading={avatar.isPending}
        />
      </View>

      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Họ và tên"
            required
            autoCapitalize="words"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />

      {/* Email chỉ đọc: dùng để đăng nhập, không đổi ở đây */}
      <View style={styles.readonly}>
        <Text style={styles.readonlyLabel}>Email</Text>
        <View style={styles.readonlyBox}>
          <Text style={styles.readonlyValue} numberOfLines={1}>
            {user?.email}
          </Text>
          {user?.emailVerified ? (
            <View style={styles.verified}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.helper}>
          Email dùng để đăng nhập, không thay đổi được.
        </Text>
      </View>

      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextField
            label="Số điện thoại"
            required
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
            helper="ReHome gọi số này khi có việc gấp với hàng ký gửi của bạn."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phone?.message}
          />
        )}
      />

      <NoteBox>
        <Text style={styles.noteText}>
          Hồ sơ này{" "}
          <Text style={styles.bold}>không phải địa chỉ giao hàng</Text>. Địa chỉ
          nhận hàng quản lý riêng ở mục Địa chỉ giao hàng.
        </Text>
      </NoteBox>

      <ErrorBox message={formError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1 },
  avatarBlock: { alignItems: "center", gap: spacing.xs },
  readonly: { gap: spacing.xs },
  readonlyLabel: { ...textStyles.label, fontSize: 14, color: colors.text },
  readonlyBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral, // nền xám = không sửa được (quy ước chung)
  },
  readonlyValue: {
    ...textStyles.body,
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  verified: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { ...textStyles.label, color: colors.success },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
