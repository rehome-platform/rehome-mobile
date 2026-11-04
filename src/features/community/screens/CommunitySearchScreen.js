import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ListItem } from "@/components/ui/ListItem";
import { useCommunitySearch } from "../hooks/useCommunity";
import { CampaignCard } from "../components/CampaignCard";

const KIND = { ORGS: "ORGS", CAMPAIGNS: "CAMPAIGNS" };
const CHIPS = [
  { value: KIND.ORGS, label: "Tổ chức" },
  { value: KIND.CAMPAIGNS, label: "Chiến dịch" },
];

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");

// CD-01 · Tìm tổ chức / chiến dịch đang nhận đồ (Guest dùng được). Gõ xong bấm Tìm mới gọi API (không gọi theo từng chữ)
export default function CommunitySearchScreen() {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(KIND.ORGS);
  const query = useCommunitySearch(kind, search);
  const list = query.data ?? [];

  const submit = () => setSearch(text.trim());

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.inputBox}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder="Tìm tổ chức, chiến dịch…"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoFocus
          autoCorrect={false}
          style={styles.input}
        />
        {text ? (
          <Pressable
            onPress={() => setText("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xoá chữ"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  let empty;
  if (!search) {
    empty = (
      <EmptyState
        icon="search-outline"
        title="Tìm nơi để quyên góp"
        description="Gõ tên tổ chức (vd. “mái ấm”) hoặc chiến dịch (vd. “áo ấm”) rồi bấm Tìm."
      />
    );
  } else if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        {query.error.code === "SEARCH_NOT_READY" ? null : (
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        )}
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState
        icon="file-tray-outline"
        title={
          kind === KIND.ORGS
            ? `Không có tổ chức nào khớp “${search}”`
            : `Không có chiến dịch đang nhận đồ nào khớp “${search}”`
        }
        description="Thử từ khoá ngắn hơn, hoặc xem tổ chức gần bạn."
      />
    );
  }

  return (
    <Screen padded={false} header={header}>
      <ChipGroup
        horizontal
        options={CHIPS}
        value={kind}
        onChange={setKind}
        style={styles.chips}
        contentStyle={styles.chipsContent}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          kind === KIND.ORGS ? (
            <ListItem
              icon="business-outline"
              title={item.displayName}
              description={item.orgTypeLabel}
              onPress={() => router.push(`/organizations/${item.id}`)}
            />
          ) : (
            <CampaignCard
              campaign={item}
              onPress={() => router.push(`/campaigns/${item.id}`)}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={empty}
        ListHeaderComponent={
          search && list.length ? (
            <Text style={styles.count}>
              {list.length}
              {query.hasNextPage ? "+" : ""} kết quả
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  pressed: { opacity: 0.6 },
  inputBox: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  chips: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  chipsContent: { paddingHorizontal: spacing.lg },
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.sm },
  count: {
    marginBottom: spacing.sm,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
