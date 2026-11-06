import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import {
  NOTIFICATION_ICON,
  NOTIFICATION_TARGET as T,
} from "@/constants/notification";
import {
  useMarkNotification,
  useNotifications,
} from "../hooks/useNotifications";
import { notificationRoute } from "../utils/notificationRoute";

// Nút mở bản ghi liên quan, theo loại đích
const TARGET_LABEL = {
  [T.ORDER]: "Xem đơn hàng",
  [T.RETURN_REQUEST]: "Xem yêu cầu trả hàng",
  [T.WITHDRAWAL]: "Xem yêu cầu rút hàng",
  [T.PRODUCT]: "Xem món ký gửi",
  [T.CONSIGNMENT_FORM]: "Xem yêu cầu ký gửi",
  [T.PAYOUT]: "Xem yêu cầu rút tiền",
  [T.WALLET]: "Mở ví ReHome",
  [T.CAMPAIGN]: "Xem chiến dịch",
  [T.POST]: "Xem bài viết",
  [T.ORGANIZATION]: "Xem hồ sơ tổ chức",
  [T.LEGAL_CHANGE]: "Xem yêu cầu đổi pháp lý",
};

// 3.13.4 · Chi tiết thông báo: nội dung đầy đủ, giờ nhận, nút mở bản ghi liên quan (nếu có).
// Mở màn = đánh dấu đã đọc. Thông báo không có đích (chỉ để báo) → không có nút.
// BE chưa có GET /notifications/{id} → lấy từ danh sách đã tải (màn danh sách luôn mở trước)
export default function NotificationDetailScreen({
  viewer = "member",
  backHref = "/notifications",
}) {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useNotifications();
  const { markRead } = useMarkNotification();
  const n = (query.data ?? []).find((x) => x.id === id);

  useEffect(() => {
    if (n && !n.isRead) markRead(n.id);
  }, [n?.id]);

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(backHref);
  const header = <AppHeader title="Thông báo" onBack={goBack} />;

  if (!n) {
    return (
      <Screen header={header}>
        {query.isPending ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : (
          <EmptyState
            icon="notifications-off-outline"
            title="Không tìm thấy thông báo"
            description="Thông báo có thể đã cũ hoặc không còn nữa."
          />
        )}
      </Screen>
    );
  }

  const href = notificationRoute(n, viewer);
  return (
    <Screen
      scroll
      header={header}
      footer={
        href ? (
          <Button
            title={TARGET_LABEL[n.targetType] ?? "Xem chi tiết"}
            onPress={() => router.push(href)}
          />
        ) : null
      }
      contentStyle={styles.content}
    >
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons
            name={NOTIFICATION_ICON[n.type] ?? "notifications-outline"}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.time}>
            {dayjs(n.createdAt).format("HH:mm, DD/MM/YYYY")}
          </Text>
        </View>
      </View>
      <Text style={styles.body}>{n.body || "Không có nội dung thêm."}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  head: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  title: { ...textStyles.heading, color: colors.text },
  time: {
    marginTop: 2,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  body: { ...textStyles.body, color: colors.text, lineHeight: 22 },
});
