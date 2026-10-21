import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
} from "react-native";
import { Redirect, router } from "expo-router";
import dayjs from "dayjs";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import {
  useMarkNotification,
  useNotifications,
} from "../hooks/useNotifications";
import { notificationRoute } from "../utils/notificationRoute";
import { NotificationRow } from "../components/NotificationRow";

// PR-05 · Thông báo (dùng chung cho tổ chức: viewer="org", backHref khác — nhánh 7)
export default function NotificationListScreen({
  viewer = "member",
  backHref = "/account",
}) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useNotifications();
  const { markRead, markAllRead, isMarkingAll } = useMarkNotification();

  if (!isAuthed) return <Redirect href="/login" />;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(backHref);
  const list = query.data ?? [];
  const hasUnread = list.some((n) => !n.isRead);

  // Nhóm Hôm nay / Trước đó
  const today = list.filter((n) => dayjs(n.createdAt).isSame(dayjs(), "day"));
  const earlier = list.filter(
    (n) => !dayjs(n.createdAt).isSame(dayjs(), "day"),
  );
  const sections = [
    ...(today.length ? [{ title: "HÔM NAY", data: today }] : []),
    ...(earlier.length ? [{ title: "TRƯỚC ĐÓ", data: earlier }] : []),
  ];

  // Bấm → đánh dấu đã đọc + mở màn liên quan (không có đích thì chỉ đánh dấu — 0.5 A19)
  const open = (n) => {
    if (!n.isRead) markRead(n.id);
    const href = notificationRoute(n, viewer);
    if (href) router.push(href);
  };

  let empty;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => query.refetch()}
        />
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState icon="notifications-outline" title="Chưa có thông báo nào" />
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Thông báo"
          onBack={goBack}
          right={
            <Button
              title="Đánh dấu đã đọc"
              variant="text"
              disabled={!hasUnread || isMarkingAll}
              onPress={() => markAllRead()}
            />
          }
        />
      }
      padded={false}
    >
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => open(item)} />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1 },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    ...textStyles.label,
    color: colors.textSecondary,
    backgroundColor: colors.background,
  },
});
