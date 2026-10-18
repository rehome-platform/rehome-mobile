import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import {
  useProductDetail,
  useSimilarProducts,
} from "../hooks/useProductDetail";
import { SALE_STATE, saleStateOf } from "../utils/saleState";
import { PhotoCarousel } from "../components/PhotoCarousel";
import { PriceTag } from "../components/PriceTag";
import { SimilarProducts } from "../components/SimilarProducts";
import { metaLine } from "../components/ProductCard";
import { setPendingRedirect } from "@/stores/pendingRedirect";
import { MockStatusPanel } from "../components/MockStatusPanel";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// Món không còn bán: nhãn trên ảnh + khối giải thích (+ ghi chú)
const STATE_INFO = {
  [SALE_STATE.UNAVAILABLE]: {
    label: "ĐANG GIỮ HÀNG",
    title: "Sản phẩm không còn khả dụng",
    text: "Món này đã được mua, hoặc đang có người khác thanh toán. Mỗi món ký gửi là đồ cũ độc bản nên không có cái thứ hai giống hệt.",
    note: "Nếu người mua kia không hoàn tất thanh toán trong 15 phút, món này có thể quay lại sàn.",
  },
  [SALE_STATE.SOLD]: {
    label: "ĐÃ BÁN",
    title: "Món này đã có chủ",
    text: "Mỗi sản phẩm ký gửi là một món duy nhất, bán xong là hết. Xem các món tương tự bên dưới.",
  },
  [SALE_STATE.ENDED]: {
    label: "NGỪNG BÁN",
    title: "Món này không còn bán",
    text: "Sản phẩm đã rời sàn ReHome. Xem các món tương tự bên dưới.",
  },
};

// [TẠM] Giỏ hàng / đặt hàng làm ở nhánh feature/cart-address
const comingSoon = () =>
  Alert.alert("Sắp có", "Giỏ hàng và đặt hàng đang được hoàn thiện.");

const askLogin = (href) =>
  Alert.alert(
    "Đăng nhập để mua hàng",
    "Bạn cần đăng nhập để thêm vào giỏ hoặc mua ngay.",
    [
      { text: "Để sau", style: "cancel" },
      {
        text: "Đăng nhập",
        onPress: () => {
          setPendingRedirect(href); // đăng nhập xong mở lại đúng món này
          router.push("/login");
        },
      },
    ],
  );

const share = (p) =>
  Share.share({
    message: `${p.name} — ${formatVnd(p.currentPrice)} trên ReHome`,
  });

// BR-04 · Chi tiết sản phẩm (Guest xem được; mua cần đăng nhập)
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useProductDetail(id);
  const product = query.data;
  const similar = useSimilarProducts(product?.categoryId, id);
  const scrollRef = useRef(null);
  const similarY = useRef(0);
  const [expanded, setExpanded] = useState(false);

  const header = (
    <AppHeader
      title=""
      onBack={goBack}
      right={
        product ? (
          <Pressable
            onPress={() => share(product)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Chia sẻ"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={colors.text}
            />
          </Pressable>
        ) : null
      }
    />
  );

  if (!product) {
    if (query.isError && query.error.status === 404) {
      return (
        <Screen header={header}>
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy sản phẩm"
            description="Món này có thể đã bị gỡ khỏi sàn."
          >
            <Button title="Về trang chủ" onPress={() => router.replace("/")} />
          </EmptyState>
        </Screen>
      );
    }
    if (query.isError) {
      return (
        <Screen header={header}>
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        </Screen>
      );
    }
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  const state = query.isPlaceholderData ? null : saleStateOf(product.status);
  const info = STATE_INFO[state];
  const gone = state === SALE_STATE.SOLD || state === SALE_STATE.ENDED;

  const scrollToSimilar = () =>
    scrollRef.current?.scrollTo({ y: similarY.current, animated: true });

  let footer = null;
  if (state === SALE_STATE.ON_SALE) {
    const onBuy = isAuthed ? comingSoon : () => askLogin(`/products/${id}`);
    footer = (
      <View style={styles.footerRow}>
        <Button
          title="Thêm vào giỏ"
          variant="secondary"
          onPress={onBuy}
          style={styles.flex}
        />
        <Button title="Mua ngay" onPress={onBuy} style={styles.flex} />
      </View>
    );
  } else if (info && similar.data?.length) {
    footer = <Button title="Xem món tương tự" onPress={scrollToSimilar} />;
  }

  return (
    <Screen
      header={header}
      footer={footer}
      scroll
      padded={false}
      scrollRef={scrollRef}
    >
      <PhotoCarousel
        photos={product.photos}
        dimmed={!!info}
        label={info?.label}
      />

      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, gone && styles.muted]}>
            {product.name}
          </Text>
          <PriceTag
            large
            struck={gone}
            currentPrice={product.currentPrice}
            originalPrice={product.originalPrice}
          />
          <Text style={styles.muted}>
            {metaLine(
              product.brandName,
              product.size ? `Size ${product.size}` : null,
              product.categoryName,
            )}
          </Text>
          {product.warehouseName ? (
            <Text style={styles.muted}>{product.warehouseName}</Text>
          ) : null}
        </View>

        {info ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>{info.title}</Text>
            <Text style={styles.text}>{info.text}</Text>
          </View>
        ) : null}
        {info?.note ? <NoteBox>{info.note}</NoteBox> : null}

        {!info ? (
          <View style={styles.inspected}>
            <View style={styles.inspectedHead}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.inspectedTitle}>
                Đã kiểm định tại kho ReHome
              </Text>
            </View>
            {product.condition ? (
              <Text style={styles.text}>Tình trạng: {product.condition}</Text>
            ) : null}
            {product.inspectedAt ? (
              <Text style={styles.muted}>
                Kiểm định ngày {dayjs(product.inspectedAt).format("DD/MM/YYYY")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {product.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.text} numberOfLines={expanded ? undefined : 4}>
              {product.description}
            </Text>
            {product.description.length > 200 ? (
              <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
                <Text style={styles.link}>
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <MockStatusPanel productId={id} status={product.status} />
      </View>

      <View onLayout={(e) => (similarY.current = e.nativeEvent.layout.y)}>
        <SimilarProducts products={similar.data} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  pressed: { opacity: 0.6 },
  body: { padding: spacing.lg, gap: spacing.lg },
  titleBlock: { gap: spacing.xs },
  name: { ...textStyles.title, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
  stateBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  stateTitle: { ...textStyles.heading, color: colors.text },
  inspected: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  inspectedHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inspectedTitle: { ...textStyles.heading, color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.heading, color: colors.text },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
});
