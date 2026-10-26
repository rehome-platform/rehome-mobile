import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Redirect,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { CHAT_NOTICE, CHAT_SUBTITLE } from "@/constants/chat";
import { chatApi } from "../api/chatApi";
import {
  useConversation,
  useDropFailed,
  useMarkRead,
  useMessages,
  useSendMessage,
} from "../hooks/useChat";
import { dayLabel, isWarehouse } from "../utils/chatRules";
import { ChatInput } from "../components/ChatInput";
import { ChatNotice } from "../components/ChatNotice";
import { MessageBubble } from "../components/MessageBubble";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/messages");

// CH-02 · Phòng chat (/messages/<id>?draft=). Dùng chung cho tổ chức (viewer="org", nhánh 10)
export default function ChatRoomScreen({ viewer = "member" }) {
  const { id, draft } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [focused, setFocused] = useState(false);
  const conv = useConversation(id);
  const query = useMessages(id, focused);
  const send = useSendMessage(id);
  const dropFailed = useDropFailed(id);
  const markRead = useMarkRead(id);
  const [text, setText] = useState(draft ?? ""); // câu soạn sẵn từ đơn / ký gửi — KHÔNG tự gửi

  // Chỉ tự hỏi lại khi phòng đang mở (rời màn / app nền thì dừng)
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const list = query.data ?? [];
  const latestTheirs = list.find((m) => !m.isMine)?.id;

  // Có tin mới của đối tác khi đang mở phòng → đánh dấu đã đọc
  useEffect(() => {
    if (focused && latestTheirs) markRead.mutate();
  }, [focused, latestTheirs]);

  if (!isAuthed) return <Redirect href="/login" />;

  const c = conv.data;
  const warehouse = isWarehouse(c);

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    send.mutate({ content, tempId: `tmp-${Date.now()}` });
    setText("");
  };
  const retry = (m) => {
    dropFailed(m.id);
    send.mutate({ content: m.content, tempId: `tmp-${Date.now()}` });
  };

  // Dải ngày: hiện ở tin đầu tiên của mỗi ngày (list mới → cũ, FlatList inverted)
  const renderItem = ({ item, index }) => {
    const older = list[index + 1];
    const newDay =
      !older || !dayjs(older.createdAt).isSame(item.createdAt, "day");
    return (
      <View>
        {newDay ? (
          <Text style={styles.day}>{dayLabel(item.createdAt)}</Text>
        ) : null}
        <MessageBubble message={item} onRetry={retry} />
      </View>
    );
  };

  return (
    <Screen
      header={
        <AppHeader
          title={c?.counterpart?.displayName ?? "Tin nhắn"}
          onBack={goBack}
        />
      }
      padded={false}
      footer={<ChatInput value={text} onChange={setText} onSend={submit} />}
    >
      {c ? (
        <View style={styles.strip}>
          <Text style={styles.tag}>
            {viewer === "org"
              ? "Thành viên"
              : warehouse
                ? "Hộp thư ReHome"
                : "Đã xác minh"}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {viewer === "org" ? "Người quyên góp" : CHAT_SUBTITLE[c.type]}
          </Text>
          {__DEV__ && MOCK.chat ? (
            <Text
              style={styles.mock}
              onPress={() => {
                chatApi.mockFailNextSend();
                showToast("Lần gửi sau sẽ lỗi");
              }}
            >
              Mock: lỗi lần gửi sau
            </Text>
          ) : null}
        </View>
      ) : null}

      {query.isPending ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : query.isError ? (
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      ) : (
        <FlatList
          inverted
          data={list}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage)
              query.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          // inverted: Footer nằm TRÊN CÙNG, Header nằm DƯỚI CÙNG
          ListFooterComponent={
            c && viewer !== "org" ? (
              <ChatNotice>{CHAT_NOTICE[c.type]}</ChatNotice>
            ) : null
          }
          ListHeaderComponent={
            warehouse && viewer !== "org" ? (
              <Text style={styles.staff}>
                Nhân viên ReHome · không hiện tên từng người
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  sub: { flex: 1, ...textStyles.caption, color: colors.textSecondary },
  mock: { ...textStyles.caption, color: colors.accent },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  day: {
    alignSelf: "center",
    marginVertical: spacing.sm,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  staff: {
    alignSelf: "center",
    marginTop: spacing.sm,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
