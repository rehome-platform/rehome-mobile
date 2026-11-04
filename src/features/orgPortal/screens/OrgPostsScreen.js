import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { BellButton } from "@/features/notifications/components/BellButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { SearchBar } from "@/components/ui/SearchBar";
import { matchesSearch } from "@/utils/search";
import { showToast } from "@/utils/toast";
import { useAuthStore } from "@/stores/authStore";
import {
  useDeletePost,
  useMyPosts,
  useTogglePostLike,
} from "@/features/orgPortal/hooks/usePosts";
import { OrgPostCard } from "@/features/orgPortal/components/OrgPostCard";

const openNew = () => router.push("/org/my-posts/new");
const openEdit = (p) => router.push(`/org/my-posts/${p.id}/edit`);
const openComments = (p) => router.push(`/org/my-posts/${p.id}/comments`);

// Trích ngắn cho hộp xác nhận xoá
const excerpt = (text) => (text.length > 50 ? `${text.slice(0, 47)}…` : text);

// OB-01 · Bài viết đã đăng: + Đăng bài, ⋯ (Sửa · Xem bình luận · Xoá), xoá có hỏi lại
export default function OrgPostsScreen() {
  const query = useMyPosts();
  const remove = useDeletePost();
  const like = useTogglePostLike();
  const user = useAuthStore((s) => s.user); // tên + logo tổ chức cho đầu thẻ bài
  const [keyword, setKeyword] = useState("");
  const all = query.data ?? [];
  // Lọc trên máy (đã tải đủ bài): nội dung + tên chiến dịch gắn kèm, không phân biệt dấu
  const posts = all.filter((p) =>
    matchesSearch(keyword, p.content, p.campaignTitle),
  );

  const confirmDelete = (p) =>
    Alert.alert(
      "Xoá bài viết này?",
      `Bài "${excerpt(p.content)}" cùng ${p.likeCount} lượt thích và ${p.commentCount} bình luận sẽ biến mất khỏi Cộng đồng. Không khôi phục được.`,
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Xoá bài",
          style: "destructive",
          onPress: () =>
            remove.mutate(p.id, {
              onSuccess: () => showToast("Đã xoá bài viết"),
              onError: (e) => Alert.alert("Chưa xoá được", e.message),
            }),
        },
      ],
    );

  const openMenu = (p) =>
    Alert.alert("Bài viết", undefined, [
      { text: "Sửa", onPress: () => openEdit(p) },
      { text: "Xem bình luận", onPress: () => openComments(p) },
      { text: "Xoá", style: "destructive", onPress: () => confirmDelete(p) },
    ]);

  let empty;
  if (keyword.trim() && all.length) {
    empty = (
      <EmptyState
        icon="search-outline"
        title="Không tìm thấy bài viết"
        description={`Không có bài nào khớp “${keyword.trim()}”. Thử từ khoá khác hoặc tên chiến dịch.`}
      />
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
        icon="newspaper-outline"
        title="Chưa có bài viết nào"
        description="Chia sẻ hoạt động của tổ chức để người quyên góp tin tưởng hơn."
      >
        <Button title="Đăng bài đầu tiên" onPress={openNew} />
      </EmptyState>
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Bài viết đã đăng"
          right={<BellButton href="/org/notifications" />}
        />
      }
      // Cùng kiểu "Tạo chiến dịch mới" ở tab Chiến dịch: hành động chính là nút lớn ở chân màn
      footer={
        all.length ? <Button title="Đăng bài mới" onPress={openNew} /> : null
      }
      edges={["top"]}
      padded={false}
    >
      <View style={styles.searchWrap}>
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm theo nội dung, tên chiến dịch…"
        />
      </View>
      <FlatList
        data={posts}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <OrgPostCard
            post={item}
            org={user}
            onLike={() => like.mutate({ id: item.id, liked: !item.likedByMe })}
            onComments={() => openComments(item)}
            onEdit={() => openEdit(item)}
            onMenu={() => openMenu(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={empty}
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  gap: { height: spacing.md },
});
