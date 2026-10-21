import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Redirect, router } from "expo-router";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ListItem } from "@/components/ui/ListItem";
import { useAuthStore } from "@/stores/authStore";
import { useMyFollowing } from "../hooks/useCommunity";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// PR-01 · Tổ chức đang theo dõi
export default function FollowingScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useMyFollowing();

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
      <EmptyState
        icon="heart-outline"
        title="Bạn chưa theo dõi tổ chức nào"
        description="Theo dõi để thấy bài viết và chiến dịch mới của tổ chức ở tab Cộng đồng."
      >
        <Button
          title="Mở Cộng đồng"
          onPress={() => router.replace("/community")}
        />
      </EmptyState>
    );
  }

  return (
    <Screen
      header={<AppHeader title="Tổ chức đang theo dõi" onBack={goBack} />}
      padded={false}
    >
      <FlatList
        data={query.data ?? []}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <ListItem
            icon="business-outline"
            title={item.displayName}
            description={item.orgTypeLabel}
            onPress={() => router.push(`/organizations/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { flexGrow: 1, padding: spacing.lg },
  sep: { height: spacing.sm },
});
