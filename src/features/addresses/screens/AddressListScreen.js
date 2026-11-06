import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { ADDRESS_LIMIT } from "@/constants/order";
import { showToast } from "@/utils/toast";
import { formatAddress } from "@/utils/format";
import { formatVnd } from "@/utils/money";
import { ERROR_CODES } from "@/constants/errorCodes";
import { ordersApi } from "@/features/orders/api/ordersApi";
import { useOrderMutation } from "@/features/orders/hooks/useOrders";
import {
  useAddresses,
  useDeleteAddress,
  useSaveAddress,
} from "../hooks/useAddresses";
import { AddressCard } from "../components/AddressCard";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// BR-06 · Địa chỉ giao hàng (quản lý). Chế độ chọn cho checkout thêm ở nhánh 3
export default function AddressListScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const addresses = useAddresses();
  const save = useSaveAddress();
  const remove = useDeleteAddress();
  const { select, orderId } = useLocalSearchParams();
  const checkoutMode = select === "1"; // mở từ checkout: bấm thẻ để chọn địa chỉ giao
  const orderMode = select === "order" && !!orderId; // mở từ chi tiết đơn: đổi địa chỉ giao của đơn (hướng A)
  const storeAddressId = useCheckoutStore((s) => s.addressId);
  const setAddressId = useCheckoutStore((s) => s.setAddressId);
  const changeAddress = useOrderMutation(({ addressId }) =>
    ordersApi.changeShippingAddress(orderId, addressId),
  );

  if (!isAuthed) return <Redirect href="/login" />;

  const header = (
    <AppHeader
      title={
        orderMode
          ? "Đổi địa chỉ giao cho đơn"
          : checkoutMode
            ? "Chọn địa chỉ giao hàng"
            : "Địa chỉ giao hàng"
      }
      onBack={goBack}
    />
  );

  // Đổi địa chỉ của đơn: hỏi lại (phí ship có thể đổi, chỉ đổi 1 lần) → gọi API → về chi tiết đơn
  const pickForOrder = (a) => {
    if (!a.provinceName || !a.wardName)
      return Alert.alert(
        "Cần bổ sung địa chỉ",
        "Địa chỉ này chưa có tỉnh/thành và phường/xã. Bổ sung rồi chọn lại nhé.",
      );
    Alert.alert(
      "Đổi địa chỉ giao cho đơn?",
      `Giao tới: ${formatAddress(a)}.\nPhí ship được tính lại theo địa chỉ mới. Mỗi đơn chỉ đổi được 1 lần.`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Đổi địa chỉ",
          onPress: () =>
            changeAddress.mutate(
              { addressId: a.id },
              {
                onSuccess: ({ refundedAmount }) => {
                  showToast(
                    refundedAmount > 0
                      ? `Đã đổi địa chỉ, hoàn ${formatVnd(refundedAmount)} phí ship chênh lệch vào ví`
                      : "Đã đổi địa chỉ giao",
                  );
                  goBack();
                },
                onError: (e) =>
                  Alert.alert(
                    e.code === ERROR_CODES.SHIPPING_FEE_INCREASED
                      ? "Phí ship sẽ tăng"
                      : "Chưa đổi được địa chỉ",
                    e.code === ERROR_CODES.SHIPPING_FEE_INCREASED
                      ? // BE ghi số thô "35000.00đ" → định dạng lại "35.000 đ"
                        `${e.message.replace(/(\d+)(?:\.\d+)?\s?đ/g, (_, n) => formatVnd(Number(n)))}\nĐơn đã thanh toán nên không thu thêm được. Bạn có thể huỷ đơn (hoàn 100%) rồi đặt lại với địa chỉ này.`
                      : e.message,
                  ),
              },
            ),
        },
      ],
    );
  };

  const list = addresses.data ?? [];
  const full = list.length >= ADDRESS_LIMIT;
  // Địa chỉ đang chọn ở checkout: đã chọn trước đó, không thì địa chỉ mặc định
  const currentId = storeAddressId ?? list.find((a) => a.isDefault)?.id;

  // id địa chỉ đang được lưu / xoá → khoá nút trên thẻ đó
  const busyId = save.isPending
    ? save.variables?.id
    : remove.isPending
      ? remove.variables
      : null;

  const setDefault = (a) => {
    // Địa chỉ tạo trước BE 868d933 chưa có tỉnh/phường → PUT sẽ 400, mời bổ sung trước
    if (!a.provinceName || !a.wardName) {
      Alert.alert(
        "Cần bổ sung địa chỉ",
        "Địa chỉ này chưa có tỉnh/thành và phường/xã. Bổ sung rồi đặt làm mặc định nhé.",
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Bổ sung",
            onPress: () => router.push(`/addresses/${a.id}/edit`),
          },
        ],
      );
      return;
    }
    save.mutate(
      {
        id: a.id,
        values: {
          recipientName: a.recipientName,
          phone: a.phone,
          provinceName: a.provinceName,
          wardName: a.wardName,
          addressDetail: a.addressDetail,
          isDefault: true, // BE tự bỏ mặc định ở địa chỉ cũ
        },
      },
      {
        onSuccess: () => showToast("Đã đổi địa chỉ mặc định"),
        onError: (e) => Alert.alert("Chưa đổi được", e.message),
      },
    );
  };

  const confirmDelete = (a) =>
    Alert.alert("Xoá địa chỉ?", `Địa chỉ của "${a.recipientName}" sẽ bị xoá.`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () =>
          remove.mutate(a.id, {
            onSuccess: () => showToast("Đã xoá địa chỉ"),
            onError: (e) => Alert.alert("Chưa xoá được", e.message),
          }),
      },
    ]);

  if (addresses.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (addresses.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={addresses.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => addresses.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }
  if (!list.length) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="location-outline"
          title="Chưa có địa chỉ giao hàng"
          description="Thêm địa chỉ để đặt hàng nhanh hơn. Địa chỉ đầu tiên sẽ là địa chỉ mặc định."
        >
          <Button
            title="+ Thêm địa chỉ"
            onPress={() => router.push("/addresses/new")}
          />
        </EmptyState>
      </Screen>
    );
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        title="+ Thêm địa chỉ mới"
        disabled={full}
        onPress={() => router.push("/addresses/new")}
      />
      {full ? (
        <Text style={styles.fullText}>
          Đã đủ {ADDRESS_LIMIT} địa chỉ. Xoá bớt để thêm địa chỉ mới.
        </Text>
      ) : null}
    </View>
  );

  return (
    <Screen header={header} footer={footer} padded={false}>
      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            busy={
              busyId === item.id ||
              (changeAddress.isPending &&
                changeAddress.variables?.addressId === item.id)
            }
            selected={checkoutMode && item.id === currentId}
            onPress={
              orderMode
                ? () => pickForOrder(item)
                : checkoutMode
                  ? () => {
                      setAddressId(item.id);
                      router.back();
                    }
                  : undefined
            }
            onEdit={() => router.push(`/addresses/${item.id}/edit`)}
            onSetDefault={() => setDefault(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListFooterComponent={
          <NoteBox style={styles.note}>
            {`Tối đa ${ADDRESS_LIMIT} địa chỉ. Đơn đã đặt giữ nguyên địa chỉ lúc đặt — sửa ở đây không ảnh hưởng đơn đó.`}
          </NoteBox>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={addresses.isRefetching}
            onRefresh={addresses.refetch}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  list: { padding: spacing.lg },
  gap: { height: spacing.md },
  note: { marginTop: spacing.lg },
  footer: { gap: spacing.xs },
  fullText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
