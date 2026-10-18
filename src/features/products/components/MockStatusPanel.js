import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { NoteBox } from "@/components/ui/NoteBox";
import { productsApi } from "../api/productsApi";

const OPTIONS = [
  { value: PRODUCT_STATUS.ON_SALE, label: "Đang bán" },
  { value: PRODUCT_STATUS.RESERVED, label: "Giữ hàng" },
  { value: PRODUCT_STATUS.SOLD, label: "Đã bán" },
  { value: PRODUCT_STATUS.WITHDRAWN, label: "Ngừng bán" },
];

// [DEV] Đổi trạng thái món đang xem trong dữ liệu mock để xem BR-04 ở từng trạng thái.
// Không hiện ở bản build thật (__DEV__ = false) và khi đã dùng API 50 thật
export function MockStatusPanel({ productId, status }) {
  const queryClient = useQueryClient();
  if (!__DEV__ || !MOCK.productDetail) return null;

  const change = async (next) => {
    await productsApi.mockSetStatus(productId, next);
    // Làm mới chi tiết + danh sách (món rời sàn / quay lại sàn như thật)
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <NoteBox>
      <View style={styles.wrap}>
        <Text style={styles.title}>
          Mock (chỉ bản dev): đổi trạng thái món này
        </Text>
        <ChipGroup options={OPTIONS} value={status} onChange={change} />
        <Text
          style={styles.link}
          onPress={() => router.push("/products/khong-co")}
        >
          Mở sản phẩm không tồn tại (404)
        </Text>
      </View>
    </NoteBox>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { ...textStyles.label, color: colors.textSecondary },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
});
