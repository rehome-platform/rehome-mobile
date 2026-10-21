import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { Redirect, router } from "expo-router";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useConversations } from "../hooks/useChat";
import { ConversationRow } from "../components/ConversationRow";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// CH-01 · Tin nhắn. viewer="org" dùng ở phía tổ chức (nhánh 10)
export default function ConversationListScreen({ viewer = "member" }) {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useConversations({ poll: true });

  if (!isAuthed) return <Redirect href="/login" />;

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
      <EmptyState icon="chatbubbles-outline" title="Chưa có tin nhắn nào" />
    );
  }

  return (
    <Screen
      header={<AppHeader title="Tin nhắn" onBack={goBack} />}
      padded={false}
    >
      <FlatList
        data={query.data ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow
            conv={item}
            onPress={() => router.push(`/messages/${item.id}`)}
          />
        )}
        ListEmptyComponent={empty}
        ListFooterComponent={
          query.data?.length ? (
            <Text style={styles.note}>
              {viewer === "org"
                ? "Tổ chức không tự nhắn trước — hội thoại chỉ mở khi Member bấm Nhắn tin."
                : "Hội thoại với tổ chức chỉ xuất hiện sau khi bạn bấm Nhắn tin ở trang tổ chức."}
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
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
  note: {
    margin: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
