import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { PRODUCT_STATUS } from "@/constants/consignment";
import {
  cartItems,
  useAddToCart,
  useCart,
} from "@/features/cart/hooks/useCart";
import { useDeleteTryonImage, useTryonImage } from "../hooks/useTryon";
import { shortTitle } from "../utils/tryonRules";
import { AiBadge } from "../components/AiBadge";
import { OutfitItemRow } from "../components/OutfitItemRow";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/tryon/collection");

// AI-06 · Xem ảnh trong bộ sưu tập + xoá (/tryon/collection/<id>)
export default function TryonImageScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useTryonImage(id);
  const img = query.data;
  const cart = useCart();
  const addToCart = useAddToCart();
  const remove = useDeleteTryonImage();

  if (!isAuthed) return <Redirect href="/login" />;

  const confirmDelete = () =>
    Alert.alert(
      "Xoá ảnh thử đồ này?",
      "Ảnh biến mất khỏi Bộ sưu tập, không khôi phục được. Việc này không ảnh hưởng tới sản phẩm hay bất kỳ đơn hàng nào.",
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Xoá ảnh",
          style: "destructive",
          onPress: () =>
            remove.mutate(id, {
              onSuccess: () => {
                showToast("Đã xoá ảnh thử đồ");
                goBack();
              },
              onError: (e) => showToast(e.message),
            }),
        },
      ],
    );

  const header = (
    <AppHeader
      title={
        img
          ? `${dayjs(img.createdAt).format("DD/MM/YYYY")} · ${shortTitle(img.items)}`
          : "Ảnh thử đồ"
      }
      onBack={goBack}
      right={
        img ? (
          <Pressable
            onPress={confirmDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xoá ảnh"
          >
            <Ionicons name="trash-outline" size={22} color={colors.text} />
          </Pressable>
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

  const inCartIds = new Set(cartItems(cart.data).map((ci) => ci.product.id));

  const add = (pid) =>
    addToCart.mutate(pid, {
      onSuccess: () => showToast("Đã thêm vào giỏ"),
      onError: (e) => showToast(e.message),
    });

  return (
    <Screen scroll header={header} contentStyle={styles.content}>
      <View style={styles.photo}>
        <Image
          source={{ uri: img.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <AiBadge />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SẢN PHẨM TRONG ẢNH NÀY</Text>
        {(img.items ?? []).map((it, i) => {
          const available = it.status === PRODUCT_STATUS.ON_SALE;
          return (
            <View key={it.id} style={[styles.item, i > 0 && styles.divider]}>
              <OutfitItemRow
                item={it}
                right={<Text style={styles.okTag}>CÒN MUA ĐƯỢC</Text>}
              />
              {available ? (
                <View style={styles.actions}>
                  {inCartIds.has(it.id) ? (
                    <Button
                      title="Xem giỏ"
                      variant="secondary"
                      onPress={() => router.push("/cart")}
                      style={styles.flex}
                    />
                  ) : (
                    <Button
                      title="Thêm giỏ"
                      variant="secondary"
                      loading={
                        addToCart.isPending && addToCart.variables === it.id
                      }
                      onPress={() => add(it.id)}
                      style={styles.flex}
                    />
                  )}
                  <Button
                    title="Mua ngay"
                    onPress={() =>
                      router.push({
                        pathname: "/checkout",
                        params: { buyNow: it.id },
                      })
                    }
                    style={styles.flex}
                  />
                </View>
              ) : (
                <Text style={styles.soldTag}>ĐÃ BÁN</Text>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        Lưu tự động khi tạo ảnh. Giá và tình trạng còn hàng lấy theo sàn hiện
        tại — có thể khác lúc bạn thử đồ.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  photo: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    borderRadius: radius.card,
    backgroundColor: colors.neutral,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  item: { gap: spacing.sm, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.neutral },
  actions: { flexDirection: "row", gap: spacing.md },
  okTag: { ...textStyles.label, color: colors.primary },
  soldTag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    ...textStyles.label,
    color: colors.textSecondary,
  },
  caption: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
