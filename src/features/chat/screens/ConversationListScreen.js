import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SearchBar } from "@/components/ui/SearchBar";
import { matchesSearch } from "@/utils/search";
import { Redirect, router } from "expo-router";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { BellButton } from "@/features/notifications/components/BellButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useConversations } from "../hooks/useChat";
import { ConversationRow } from "../components/ConversationRow";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// CH-01 · Tin nhắn. viewer="org": OM-01 — là một tab (không nút quay lại), phòng chat ở /org/my-messages/<id>
export default function ConversationListScreen({ viewer = "member" }) {
  const isOrg = viewer === "org";
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useConversations({ poll: true });
  const [keyword, setKeyword] = useState("");

  if (!isAuthed) return <Redirect href="/login" />;

  const all = query.data ?? [];
  // Tổ chức có thể có nhiều hội thoại → lọc trên máy theo tên Member + tin cuối (như Zalo / Messenger)
  const list = isOrg
    ? all.filter((c) =>
        matchesSearch(
          keyword,
          c.counterpart?.displayName,
          c.lastMessage?.content,
        ),
      )
    : all;

  let empty;
  if (keyword && all.length) {
    empty = (
      <Text style={styles.noResult}>
        Không có hội thoại nào khớp “{keyword.trim()}”.
      </Text>
    );
  } else if (query.isPending) {
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
      <EmptyState
        icon="chatbubbles-outline"
        title="Chưa có tin nhắn nào"
        description={
          isOrg
            ? "Hội thoại chỉ mở khi Member bấm Nhắn tin ở trang tổ chức của bạn."
            : undefined
        }
      />
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Tin nhắn"
          onBack={isOrg ? undefined : goBack}
          // Tổ chức: Tin nhắn là một tab → có chuông như các tab khác. Member mở từ icon nên chỉ có nút quay lại
          right={isOrg ? <BellButton href="/org/notifications" /> : undefined}
        />
      }
      edges={isOrg ? ["top"] : undefined}
      padded={false}
    >
      {isOrg && all.length ? (
        <View style={styles.searchWrap}>
          <SearchBar
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm theo tên người nhắn, nội dung…"
          />
        </View>
      ) : null}
      <FlatList
        data={list}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow
            conv={item}
            viewer={viewer}
            onPress={() =>
              router.push(
                isOrg ? `/org/my-messages/${item.id}` : `/messages/${item.id}`,
              )
            }
          />
        )}
        ListEmptyComponent={empty}
        ListFooterComponent={
          list.length && !keyword ? (
            <Text style={styles.note}>
              {isOrg
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  noResult: {
    padding: spacing.xl,
    textAlign: "center",
    ...textStyles.body,
    color: colors.textSecondary,
  },
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
