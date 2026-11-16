import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useTryonJobStore } from "@/stores/tryonJobStore";
import { TRYON_JOB_STATUS as J } from "@/constants/tryon";
import { useTryonImages } from "../hooks/useTryon";
import { isNewImage, shortTitle, soldCount } from "../utils/tryonRules";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// AI-05 · Bộ sưu tập thử đồ. Nút "Chọn" (xoá nhiều) ẩn — xoá từng ảnh ở AI-06 [GIẢ ĐỊNH]
export default function CollectionScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useTryonImages();
  const running = useTryonJobStore((s) => s.job?.status === J.RUNNING);
  const markSeen = useTryonJobStore((s) => s.markSeen);
  const { width } = useWindowDimensions();
  const cellWidth = (width - spacing.lg * 2 - spacing.md) / 2;

  // Mở bộ sưu tập → tắt chấm "ảnh mới" ở tab Cá nhân
  useFocusEffect(
    useCallback(() => {
      markSeen();
    }, []),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const items = query.data?.items ?? [];
  // Đang tạo ảnh → ô đầu lưới là ô "Đang tạo…"
  const data = running ? [{ id: "__running" }, ...items] : items;

  let empty = null;
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
        icon="images-outline"
        title="Chưa có ảnh thử đồ nào"
        description="Mở một sản phẩm và bấm Thử đồ AI."
      >
        <Button
          title="Khám phá sản phẩm"
          onPress={() => router.dismissTo("/")}
        />
      </EmptyState>
    );
  }

  const renderItem = ({ item }) => {
    if (item.id === "__running") {
      return (
        <View style={[styles.cell, { width: cellWidth }]}>
          <View style={[styles.photo, styles.running]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.caption}>Đang tạo…</Text>
          </View>
        </View>
      );
    }
    const sold = soldCount(item);
    return (
      <Pressable
        onPress={() => router.push(`/tryon/collection/${item.id}`)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.cell,
          { width: cellWidth },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.photo, sold > 0 && styles.dim]}>
          <Image
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
          />
          {sold > 0 ? (
            <Text style={[styles.tag, styles.tagOutline]}>
              {sold} MÓN ĐÃ BÁN
            </Text>
          ) : isNewImage(item) ? (
            <Text style={styles.tag}>MỚI</Text>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {shortTitle(item.items)}
        </Text>
        <Text style={styles.caption}>
          {dayjs(item.createdAt).format("DD/MM/YYYY")} ·{" "}
          {sold > 0 ? "không mua đủ được" : "còn mua được"}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen
      header={<AppHeader title="Bộ sưu tập thử đồ" onBack={goBack} />}
      padded={false}
    >
      {items.length ? (
        <Text style={styles.strip}>
          {query.data.total} ảnh · lưu tự động khi bạn tạo
        </Text>
      ) : null}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
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
  strip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...textStyles.caption,
    color: colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  list: { flexGrow: 1, padding: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.lg },
  cell: { gap: 2 },
  pressed: { opacity: 0.8 },
  photo: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
    marginBottom: spacing.xs,
  },
  dim: { opacity: 0.6 },
  running: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
  },
  tag: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  tagOutline: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  title: { ...textStyles.body, color: colors.text },
  caption: { ...textStyles.caption, color: colors.textSecondary },
});
