import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { PaymentMethodPicker } from "../components/PaymentMethodPicker";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { MOCK } from "@/config/env";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { useAuthStore } from "@/stores/authStore";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { formatVnd } from "@/utils/money";
import { formatAddress, formatPhone } from "@/utils/format";
import { showToast } from "@/utils/toast";
import { cartApi } from "@/features/cart/api/cartApi";
import { cartKeys } from "@/features/cart/api/queryKeys";
import { useCart } from "@/features/cart/hooks/useCart";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useProductDetail } from "@/features/products/hooks/useProductDetail";
import { shopKeys } from "@/features/products/api/queryKeys";
import { ordersApi } from "../api/ordersApi";
import { OrderGroupCard, OrderLine } from "../components/OrderGroupCard";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/cart");
const sum = (lines) => lines.reduce((s, l) => s + l.price, 0);

// Mọi món trong giỏ → dạng dòng chung { productId, cartItemId, name, thumbnailUrl, price, warehouseId, warehouseName, available }
const cartLines = (cart) =>
  (cart?.groupedByWarehouse ?? []).flatMap((g) =>
    g.items.map((i) => ({
      productId: i.product.id,
      cartItemId: i.id,
      name: i.product.name,
      thumbnailUrl: i.product.thumbnailUrl,
      price: i.product.currentPrice,
      warehouseId: g.warehouseId,
      warehouseName: g.warehouseName,
      available: !i.unavailableReason,
    })),
  );

const productLine = (p) => ({
  productId: p.id,
  cartItemId: null,
  name: p.name,
  thumbnailUrl: p.thumbnailUrl,
  price: p.currentPrice,
  warehouseId: p.warehouseId ?? "buy-now",
  warehouseName: p.warehouseName ?? "Địa điểm ký gửi",
  available: p.status === PRODUCT_STATUS.ON_SALE,
});

// Gom theo kho = một đơn (BE tách đơn theo kho)
const groupLines = (lines) => {
  const map = new Map();
  lines.forEach((l) => {
    const g = map.get(l.warehouseId) ?? {
      warehouseId: l.warehouseId,
      warehouseName: l.warehouseName,
      lines: [],
    };
    g.lines.push(l);
    map.set(l.warehouseId, g);
  });
  return [...map.values()];
};

// BR-08 · Đặt hàng. Vào từ giỏ (?ids=…) hoặc Mua ngay (?buyNow=id)
export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const buyNowId = params.buyNow;
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const queryClient = useQueryClient();
  const cart = useCart();
  const product = useProductDetail(buyNowId);
  const addresses = useAddresses();
  const storeAddressId = useCheckoutStore((s) => s.addressId);
  const setPendingOrders = useCheckoutStore((s) => s.setPendingOrders);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);

  const [ids, setIds] = useState(() =>
    buyNowId
      ? [buyNowId]
      : String(params.ids ?? "")
          .split(",")
          .filter(Boolean),
  );
  const [formError, setFormError] = useState(null);
  const place = useMutation({ mutationFn: ordersApi.createOrders });

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Đặt hàng" onBack={goBack} />;
  const loading = buyNowId
    ? product.isPending || product.isPlaceholderData
    : cart.isPending;
  if (loading) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  const inCart = cartLines(cart.data);
  const source = buyNowId
    ? product.data
      ? [productLine(product.data)]
      : []
    : inCart;
  const lines = source.filter((l) => ids.includes(l.productId));
  const lost = lines.filter((l) => !l.available); // vừa bị người khác đặt / không còn bán
  const okLines = lines.filter((l) => l.available);

  if (!lines.length) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="cart-outline"
          title="Không có món nào để đặt"
          description="Các món bạn chọn không còn trong giỏ."
        >
          <Button title="Về giỏ hàng" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  const addrList = addresses.data ?? [];
  const address =
    addrList.find((a) => a.id === storeAddressId) ??
    addrList.find((a) => a.isDefault) ??
    addrList[0];

  const submit = (list) => {
    if (place.isPending) return; // chống bấm 2 lần: mỗi lần là tạo đơn + giữ hàng
    if (!address) return setFormError("Thêm địa chỉ giao hàng trước khi đặt.");
    setFormError(null);
    const productIds = list.map((l) => l.productId);
    // Đặt đúng TOÀN BỘ giỏ (mọi món còn mua được) → không gửi productIds, BE tự xoá khỏi giỏ.
    // Còn lại gửi productIds: BE KHÔNG xoá khỏi giỏ → app tự xoá (PHASE3_GUIDE 5.2b #2)
    const wholeCart =
      !buyNowId &&
      inCart.length === list.length &&
      inCart.every((l) => l.available);

    place.mutate(
      {
        shippingAddressId: address.id,
        productIds: wholeCart ? undefined : productIds,
      },
      {
        onSuccess: async (orders) => {
          if (!wholeCart) {
            const cartItemIds = inCart
              .filter((l) => productIds.includes(l.productId))
              .map((l) => l.cartItemId);
            await Promise.allSettled(
              cartItemIds.map((cid) => cartApi.removeCartItem(cid)),
            );
          }
          // BE không trả tên kho → lấy từ các dòng vừa đặt
          const warehouseNameOf = (whId) =>
            list.find((l) => l.warehouseId === whId)?.warehouseName ??
            "Địa điểm ký gửi";
          setPendingOrders(
            orders.map((o) => ({
              ...o,
              warehouseName: warehouseNameOf(o.warehouseId),
            })),
          );
          queryClient.invalidateQueries({ queryKey: cartKeys.cart });
          queryClient.invalidateQueries({ queryKey: ["products"] }); // món đã RESERVED, rời sàn
          router.replace("/payment"); // replace: Back không quay lại đây đặt thêm lần nữa
        },
        onError: (e) => {
          if (e.status === 409) {
            // Có món vừa bị người khác đặt trước — BE không nói món nào → tải lại để biết
            queryClient.invalidateQueries({ queryKey: cartKeys.cart });
            if (buyNowId)
              queryClient.invalidateQueries({
                queryKey: shopKeys.product(buyNowId),
              });
            return showToast("Có món vừa bị người khác đặt trước");
          }
          setFormError(e.message);
        },
      },
    );
  };

  // ---- Trạng thái "Giữ hàng thất bại": có món không đặt được ----
  if (lost.length) {
    const orderRest = () => {
      setIds(okLines.map((l) => l.productId));
      submit(okLines);
    };
    return (
      <Screen
        scroll
        header={header}
        contentStyle={styles.content}
        footer={
          <View style={styles.footerCol}>
            {okLines.length ? (
              <Button
                title={`Đặt ${okLines.length} món còn lại — ${formatVnd(sum(okLines))}`}
                loading={place.isPending}
                onPress={orderRest}
              />
            ) : null}
            <Button
              title={buyNowId ? "Xem món khác" : "Quay lại giỏ hàng"}
              variant="secondary"
              onPress={goBack}
            />
          </View>
        }
      >
        <View style={styles.resultHead}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text} />
          <Text style={styles.resultTitle}>
            {lost.length} món vừa có người khác mua trước
          </Text>
          <Text style={styles.resultDesc}>
            Chưa đặt đơn nào, chưa có khoản tiền nào bị trừ.
            {okLines.length
              ? ` Bạn vẫn đặt được ${okLines.length} món còn lại.`
              : ""}
          </Text>
        </View>

        <View style={[styles.box, styles.boxStrong]}>
          <Text style={styles.boxTitle}>KHÔNG ĐẶT ĐƯỢC</Text>
          {lost.map((l) => (
            <OrderLine key={l.productId} line={l} faded />
          ))}
          <Text style={styles.boxNote}>
            Hàng ký gửi là món duy nhất, không có món thứ hai giống hệt. Món này
            chỉ quay lại sàn nếu người mua kia không thanh toán trong 15 phút.
          </Text>
        </View>

        {okLines.length ? (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>VẪN ĐẶT ĐƯỢC</Text>
            {okLines.map((l) => (
              <OrderLine key={l.productId} line={l} />
            ))}
            <View style={styles.boxTotal}>
              <Text style={styles.muted}>
                Tiền hàng (chưa gồm phí vận chuyển)
              </Text>
              <Text style={styles.strong}>{formatVnd(sum(okLines))}</Text>
            </View>
          </View>
        ) : null}
        <ErrorBox message={formError} />
      </Screen>
    );
  }

  // ---- Bình thường ----
  const groups = groupLines(okLines);
  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        <View style={styles.footerCol}>
          <View style={styles.sumRow}>
            <Text style={styles.muted}>Tiền hàng</Text>
            <Text style={styles.text}>{formatVnd(sum(okLines))}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.muted}>Vận chuyển {groups.length} đơn</Text>
            <Text style={styles.muted}>Tính khi đặt hàng</Text>
          </View>
          <Button
            title="Đặt hàng · giữ hàng 15 phút"
            loading={place.isPending}
            disabled={!address}
            onPress={() => submit(okLines)}
            style={styles.mainBtn}
          />
        </View>
      }
    >
      <AddressBlock address={address} loading={addresses.isPending} />

      {groups.length >= 2 ? (
        <View style={styles.banner}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.text}
          />
          <Text style={styles.bannerText}>
            {`Hàng ở ${groups.length} địa điểm ký gửi nên tách thành ${groups.length} đơn riêng, giao ${groups.length} lần, mỗi đơn một phí vận chuyển.`}
          </Text>
        </View>
      ) : null}

      {groups.map((g, i) => (
        <OrderGroupCard
          key={g.warehouseId}
          group={g}
          index={i}
          total={groups.length}
        />
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THANH TOÁN</Text>
        <PaymentMethodPicker
          value={paymentMethod}
          onChange={setPaymentMethod}
          amount={sum(okLines)}
          isSubtotal
        />
      </View>

      <NoteBox>
        Phí vận chuyển của từng đơn được tính khi đặt và hiện ở bước thanh toán,
        trước khi bạn trả tiền. Đặt xong, hàng được giữ riêng cho bạn 15 phút.
      </NoteBox>

      {__DEV__ && MOCK.orders ? (
        <Button
          title="Mock: lần đặt tới có 1 món bị người khác mua trước"
          variant="text"
          onPress={() => {
            ordersApi.mockFailNextOrder();
            showToast("Đã bật: lần đặt tới sẽ lỗi 409");
          }}
        />
      ) : null}

      <ErrorBox message={formError} />
    </Screen>
  );
}

// Khối "Giao đến" + nút Đổi (mở danh sách địa chỉ ở chế độ chọn)
function AddressBlock({ address, loading }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>GIAO ĐẾN</Text>
        {address ? (
          <Pressable
            onPress={() => router.push("/addresses?select=1")}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.changeBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.changeText}>Đổi</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : address ? (
        <View style={styles.addressBox}>
          <Text style={styles.strong}>
            {address.recipientName} · {formatPhone(address.phone)}
          </Text>
          <Text style={styles.muted}>{formatAddress(address)}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push("/addresses/new")}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addAddress,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.changeText}>Thêm địa chỉ giao hàng</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  pressed: { opacity: 0.6 },
  section: { gap: spacing.sm },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  changeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  changeText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  addressBox: { gap: 2 },
  addAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accent,
    borderRadius: radius.input,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  bannerText: { flex: 1, ...textStyles.body, color: colors.text },
  text: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  footerCol: { gap: spacing.xs },
  sumRow: { flexDirection: "row", justifyContent: "space-between" },
  mainBtn: { marginTop: spacing.sm },
  resultHead: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  resultTitle: {
    ...textStyles.heading,
    color: colors.text,
    textAlign: "center",
  },
  resultDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  box: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  boxStrong: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  boxTitle: { ...textStyles.label, color: colors.textSecondary },
  boxNote: {
    ...textStyles.body,
    color: colors.textSecondary,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  boxTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
});
