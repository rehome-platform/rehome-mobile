import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { cartItems, useAddToCart, useCart } from "@/features/cart/hooks/useCart";
import { tryonLiveKeys } from "../api/queryKeys";
import { useLiveTryonHistory } from "../hooks/useTryonLive";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/account"));

// Lịch sử video thử đồ AI real-time đã quay xong. Bấm một dòng → màn xem lại + tải về
// (LiveTryonResultScreen, dùng lại nguyên màn hiện có).
export default function LiveTryonHistoryScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useLiveTryonHistory();
  const cart = useCart();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();

  if (!isAuthed) return <Redirect href="/login" />;

  const items = query.data?.items ?? [];

  let empty = null;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        <Button title="Thử lại" variant="secondary" onPress={() => query.refetch()} />
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState
        icon="videocam-outline"
        title="Chưa có video thử đồ nào"
        description="Mở một sản phẩm và bấm Thử đồ AI trực tiếp để quay video."
      >
        <Button title="Khám phá sản phẩm" onPress={() => router.dismissTo("/")} />
      </EmptyState>
    );
  }

  const onAdd = (productId) =>
    addToCart.mutate(productId, {
      onSuccess: () => showToast("Đã thêm vào giỏ"),
      onError: (e) => {
        // 409: món vừa bị người khác đặt, hoặc đã có trong giỏ → tải lại để nút khớp trạng thái thật
        if (e.status === 409) {
          queryClient.invalidateQueries({ queryKey: tryonLiveKeys.history });
          return showToast(e.message);
        }
        Alert.alert("Chưa thêm được vào giỏ", e.message);
      },
    });

  const renderItem = ({ item }) => {
    // Chỉ mua được khi món còn đang bán và không phải món mình ký gửi (BE cũng chặn lại)
    const canBuy = item.productStatus === PRODUCT_STATUS.ON_SALE && !item.isMine;
    const inCart = cartItems(cart.data).some((i) => i.product.id === item.productId);
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/tryon-live/result",
              params: { videoUrl: item.videoUrl, productId: item.productId },
            })
          }
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.thumb}>
            {item.productThumbnailUrl ? (
              <Image source={{ uri: item.productThumbnailUrl }} style={StyleSheet.absoluteFill} />
            ) : null}
            <View style={styles.play}>
              <Ionicons name="play" size={16} color={colors.surface} />
            </View>
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.productName}
            </Text>
            <Text style={styles.caption}>
              {dayjs(item.completedAt ?? item.createdAt).format("DD/MM/YYYY HH:mm")}
              {item.actualDurationSeconds ? ` · ${item.actualDurationSeconds} giây` : ""}
            </Text>
            {!canBuy ? (
              <Text style={styles.unavailable}>
                {item.isMine ? "Món bạn ký gửi" : "Món này không còn bán"}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
        {canBuy ? (
          <View style={styles.actions}>
            {inCart ? (
              <Button
                title="Xem giỏ hàng"
                variant="secondary"
                onPress={() => router.push("/cart")}
                style={styles.flex}
              />
            ) : (
              <Button
                title="Thêm vào giỏ"
                variant="secondary"
                loading={addToCart.isPending && addToCart.variables === item.productId}
                onPress={() => onAdd(item.productId)}
                style={styles.flex}
              />
            )}
            <Button
              title="Mua ngay"
              onPress={() =>
                router.push({ pathname: "/checkout", params: { buyNow: item.productId } })
              }
              style={styles.flex}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen header={<AppHeader title="Video thử đồ AI" onBack={goBack} />} padded={false}>
      {items.length ? (
        <Text style={styles.strip}>{query.data.total} video</Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(i) => i.sessionId}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
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
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  unavailable: { ...textStyles.caption, color: colors.error },
  pressed: { opacity: 0.8 },
  thumb: {
    width: 60,
    aspectRatio: 3 / 4,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  info: { flex: 1, gap: 2 },
  title: { ...textStyles.body, fontFamily: fonts.medium, color: colors.text },
  caption: { ...textStyles.caption, color: colors.textSecondary },
});
