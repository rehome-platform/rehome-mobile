import { useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";
import { registrationFromProfile } from "@/features/organization/utils/payload";
import {
  ORG_STATUS,
  useMyOrganization,
} from "@/features/organization/hooks/useMyOrganization";

const CHECKLIST = [
  "Giấy phép / quyết định thành lập (ảnh hoặc PDF)",
  "CCCD hai mặt của người đại diện",
  "Địa chỉ và giờ nhận đồ quyên góp",
];

function StatusCard({
  icon,
  iconColor = colors.primary,
  title,
  text,
  children,
}) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={32} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {children}
    </View>
  );
}

// Màn đầu của tài khoản Tổ chức — trạng thái hồ sơ lấy từ GET /api/organizations/me:
// chưa nộp → mời nộp · PENDING → đang xác minh · REJECTED → lý do + nộp lại · VERIFIED → khung 4 tab
export default function OrgHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);
  const setMode = useOrgRegisterStore((s) => s.setMode);
  const reset = useOrgRegisterStore((s) => s.reset);
  const me = useMyOrganization();
  const { refetch } = me;

  // Quay lại màn này (vừa gửi hồ sơ, Moderator vừa duyệt…) → hỏi lại BE
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Chưa có kết quả mới thì dùng trạng thái lấy lúc đăng nhập (authStore) → VERIFIED vào tab ngay, không nháy màn
  const status = me.data
    ? me.data.verificationStatus
    : (user?.verificationStatus ?? null);

  const startRegister = () => {
    setMode("create");
    router.push("/org/registration/info");
  };
  // Bị từ chối: điền sẵn cả 4 bước từ hồ sơ cũ (ô BE không trả thì nhập lại)
  const startResubmit = () => {
    const steps = registrationFromProfile(me.data);
    reset();
    setMode("resubmit");
    Object.entries(steps).forEach(([key, data]) => saveStep(key, data));
    router.push("/org/registration/info");
  };

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  // OA-06 chỉ cho chưa nộp / PENDING / REJECTED. Đã xác minh → khung 4 tab (replace: không quay lại được)
  if (status === ORG_STATUS.VERIFIED) return <Redirect href="/org/campaigns" />;

  return (
    <Screen
      scroll
      header={<AppHeader title="Tổ chức" />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Đăng xuất"
          variant="secondary"
          onPress={confirmSignOut}
        />
      }
    >
      <Text style={styles.hello}>Đăng nhập với {user?.email}</Text>

      {me.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : me.isError ? (
        <ErrorBox message={me.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => refetch()}
          />
        </ErrorBox>
      ) : status === ORG_STATUS.PENDING ? (
        <StatusCard
          icon="hourglass-outline"
          title="Hồ sơ đang được xác minh"
          text={`${me.data.displayName} đã gửi hồ sơ. Moderator phản hồi trong 5 ngày làm việc, kết quả gửi về email đăng nhập.`}
        />
      ) : status === ORG_STATUS.REJECTED ? (
        <StatusCard
          icon="close-circle-outline"
          iconColor={colors.error}
          title="Hồ sơ chưa được duyệt"
          text="Moderator đã từ chối hồ sơ. Sửa theo lý do bên dưới rồi nộp lại."
        >
          {me.data.rejectionReason ? (
            <Text style={styles.reason}>Lý do: {me.data.rejectionReason}</Text>
          ) : null}
          <Button
            title="Sửa và nộp lại"
            onPress={startResubmit}
            style={styles.cta}
          />
        </StatusCard>
      ) : (
        <View style={styles.card}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.title}>Nộp hồ sơ xác minh tổ chức</Text>
          <Text style={styles.text}>
            ReHome cần xác minh giấy tờ pháp lý trước khi tổ chức nhận đồ quyên
            góp và mở chiến dịch. Chuẩn bị sẵn:
          </Text>
          {CHECKLIST.map((item) => (
            <View key={item} style={styles.row}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.text}>{item}</Text>
            </View>
          ))}
          <Button
            title="Bắt đầu nộp hồ sơ"
            onPress={startRegister}
            style={styles.cta}
          />
        </View>
      )}

      <NoteBox>
        Hồ sơ được duyệt trong 1–3 ngày làm việc. Kết quả gửi về email đăng
        nhập.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  loading: { marginTop: spacing.xxl },
  reason: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  hello: { ...textStyles.body, color: colors.textSecondary },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.heading,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  text: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cta: { marginTop: spacing.sm },
});
