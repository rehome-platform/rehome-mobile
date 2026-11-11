import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { ChatButton } from "@/features/chat/components/ChatButton";
import { BellButton } from "@/features/notifications/components/BellButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { useDraftCount } from "@/features/consignment/hooks/usePendingFormCount";
import { Ionicons } from "@expo/vector-icons";
import { usePendingDegradedCases } from "@/features/withdrawals/hooks/useDegradedCases";
import { MyConsignSection } from "@/features/consignment/components/MyConsignSection";

export default function ConsignTabScreen() {
  const status = useAuthStore((s) => s.status);
  return status === "authenticated" ? <MemberConsign /> : <GuestConsign />;
}

function GuestConsign() {
  return (
    <Screen edges={["top"]} header={<AppHeader title="Ký gửi" />}>
      <EmptyState
        icon="cube-outline"
        title="Đăng nhập để ký gửi"
        description="Gửi đồ cũ tới địa điểm ký gửi ReHome: nhân viên kiểm định, chụp ảnh và bán hộ bạn. Tiền về ví khi đơn hoàn thành."
      >
        <Button title="Đăng nhập" onPress={() => router.push("/login")} />
        <Button
          title="Tạo tài khoản"
          variant="secondary"
          onPress={() => router.push("/register")}
        />
      </EmptyState>
    </Screen>
  );
}

// Tab Ký gửi của Member: "Đồ ký gửi của tôi" theo hành trình (Chờ duyệt → Mang tới → Đang bán → Đã bán → Kết thúc)
function MemberConsign() {
  return (
    <Screen
      edges={["top"]}
      padded={false}
      header={
        <AppHeader
          title="Ký gửi"
          right={
            <View style={styles.headerActions}>
              <BellButton />
              <ChatButton />
            </View>
          }
        />
      }
      footer={<CreateFormButton />}
    >
      <DegradedBanner />
      <DraftBanner />
      <MyConsignSection />
    </Screen>
  );
}

// Phase 5 (0.4 #13): có món bị hỏng chờ chọn cách đền → dải nhắc đầu tab
function DegradedBanner() {
  const query = usePendingDegradedCases();
  const list = query.data ?? [];
  if (!list.length) return null;
  return (
    <Pressable
      onPress={() => router.push(`/degraded-cases/${list[0].id}`)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.alert, pressed && styles.pressed]}
    >
      <Ionicons name="alert-circle" size={20} color={colors.error} />
      <Text style={styles.alertText}>
        {list.length > 1
          ? `${list.length} món của bạn bị hỏng khi trả về địa điểm ký gửi — chọn cách đền`
          : `${list[0].productName} bị hỏng khi trả về địa điểm ký gửi — chọn cách đền`}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.text} />
    </Pressable>
  );
}

// Có món đã "Lưu món" nhưng chưa gửi (nháp trên server) → dải nhắc, bấm mở lại Ký gửi món mới (tự tải nháp).
// Quay lại tab (vừa lưu / gửi / xoá nháp) → đếm lại
function DraftBanner() {
  const query = useDraftCount();
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
  const count = query.data ?? 0;
  if (!count) return null;
  return (
    <Pressable
      onPress={() => router.push("/consign-forms/new")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.draft, pressed && styles.pressed]}
    >
      <Ionicons name="document-text-outline" size={20} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.alertText}>
          Bạn có {count} món lưu nháp chưa gửi
        </Text>
        <Text style={styles.draftSub}>
          Chọn địa điểm rồi gửi để ReHome duyệt
        </Text>
      </View>
      <Text style={styles.draftAction}>Gửi tiếp</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

// Nút lớn "Ký gửi món mới" ở chân tab (luôn hiện) — cùng kiểu "Tạo chiến dịch mới" / "Đăng bài mới" của tổ chức;
// header chỉ giữ nút icon. Số yêu cầu chờ tối đa do Admin cấu hình → không tự chặn, BE báo từng món khi gửi
function CreateFormButton() {
  return (
    <Button
      title="Ký gửi món mới"
      onPress={() => router.push("/consign-forms/new")}
    />
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  alertText: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  flex: { flex: 1 },
  draft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  draftSub: { ...textStyles.caption, color: colors.textSecondary },
  draftAction: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
