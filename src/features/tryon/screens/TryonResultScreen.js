import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useTryonJobStore } from "@/stores/tryonJobStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { TRYON_JOB_STATUS as J } from "@/constants/tryon";
import { cartApi } from "@/features/cart/api/cartApi";
import { cartKeys } from "@/features/cart/api/queryKeys";
import { cartItems, useCart } from "@/features/cart/hooks/useCart";
import { useTryonImage } from "../hooks/useTryon";
import { AiBadge } from "../components/AiBadge";
import { OutfitItemRow } from "../components/OutfitItemRow";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// Body API 97 dựng lại từ ảnh cũ (Tạo lại — 0.5 A6)
const payloadOf = (img) =>
  img.dressProductId
    ? { modelType: img.modelType, dressProductId: img.dressProductId }
    : {
        modelType: img.modelType,
        topProductId: img.topProductId,
        bottomProductId: img.bottomProductId,
      };

// AI-04 · Kết quả thử đồ (/tryon/result/<id>)
export default function TryonResultScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useTryonImage(id);
  const img = query.data;
  const cart = useCart();
  const queryClient = useQueryClient();
  const jobRunning = useTryonJobStore((s) => s.job?.status === J.RUNNING);
  const start = useTryonJobStore((s) => s.start);

  // Thêm lần lượt các món chưa có trong giỏ; 409 (vừa bán / đã có) tính là không thêm được
  const addAll = useMutation({
    mutationFn: async (list) => {
      let added = 0;
      let failed = 0;
      for (const it of list) {
        try {
          await cartApi.addToCart(it.id);
          added += 1;
        } catch {
          failed += 1;
        }
      }
      return { added, failed };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.cart }),
  });

  if (!isAuthed) return <Redirect href="/login" />;

  const header = (
    <AppHeader
      title="Kết quả thử đồ"
      onBack={goBack}
      right={
        img ? (
          <Button
            title="Tạo lại"
            variant="text"
            disabled={jobRunning}
            onPress={() => regenerate()}
          />
        ) : null
      }
    />
  );

  if (query.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
        {query.error.status === 404 ? (
          <EmptyState icon="image-outline" title="Ảnh thử đồ không còn nữa" />
        ) : (
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        )}
      </Screen>
    );
  }

  const items = img.items ?? [];
  const available = items.filter((i) => i.status === PRODUCT_STATUS.ON_SALE);
  const inCartIds = new Set(cartItems(cart.data).map((ci) => ci.product.id));
  const toAdd = available.filter((i) => !inCartIds.has(i.id));
  const total = available.reduce((s, i) => s + i.currentPrice, 0);
  const warehouses = new Set(available.map((i) => i.warehouseId));
  const allAvailable = available.length === items.length;

  // Tạo lại cùng bộ đồ → về phòng thử đồ xem tiến độ (ảnh cũ vẫn trong bộ sưu tập)
  function regenerate() {
    if (!allAvailable) {
      Alert.alert(
        "Không tạo lại được",
        "Một món trong bộ đồ không còn bán. Mở sản phẩm khác để thử đồ mới.",
      );
      return;
    }
    start(payloadOf(img), items);
    router.replace({
      pathname: "/tryon",
      params: { productId: items[0].id },
    });
  }

  const onAddAll = () =>
    addAll.mutate(toAdd, {
      onSuccess: ({ added, failed }) => {
        const gone = items.length - available.length + failed;
        showToast(
          `Đã thêm ${added} món vào giỏ` +
            (gone ? ` · ${gone} món không còn bán` : ""),
        );
      },
    });

  let footer = null;
  if (available.length) {
    footer = (
      <View style={styles.footer}>
        {toAdd.length ? (
          <Button
            title={`Thêm cả outfit vào giỏ — ${formatVnd(total)}`}
            loading={addAll.isPending}
            onPress={onAddAll}
          />
        ) : (
          <Button
            title="Xem giỏ hàng"
            variant="secondary"
            onPress={() => router.push("/cart")}
          />
        )}
        {warehouses.size > 1 ? (
          <Text style={styles.caption}>
            Các món ở {warehouses.size} kho khác nhau, khi đặt sẽ tách thành{" "}
            {warehouses.size} đơn.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.photo}>
        <Image
          source={{ uri: img.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <AiBadge />
        <View style={styles.photoNote}>
          <Text style={styles.caption}>
            Ảnh minh họa cách phối đồ. Không phản ánh form dáng và size thật
            trên người bạn.
          </Text>
        </View>
      </View>

      <View style={styles.items}>
        {items.map((it, i) => (
          <View key={it.id} style={i > 0 && styles.divider}>
            <OutfitItemRow
              item={it}
              right={
                <Button
                  title="Mua lẻ"
                  variant="secondary"
                  onPress={() => router.push(`/products/${it.id}`)}
                  style={styles.smallBtn}
                />
              }
            />
          </View>
        ))}
      </View>

      <Text style={styles.caption}>Ảnh đã tự lưu vào bộ sưu tập của bạn</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  footer: { gap: spacing.xs },
  photo: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    borderRadius: radius.card,
    backgroundColor: colors.neutral,
  },
  photoNote: {
    position: "absolute",
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  items: {
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  caption: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  smallBtn: { minHeight: 36, paddingHorizontal: spacing.md },
});
