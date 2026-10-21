import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { canRequestReturn } from "@/features/returns/utils/returnRules";
import { ordersApi } from "../api/ordersApi";
import { useOrderMutation } from "../hooks/useOrders";

// Việc phía kho / GHN làm (web Moderator) → mobile giả lập để xem từng trạng thái
const NEXT_STEP = {
  PAID: "Kho bắt đầu đóng gói",
  PACKING: "Bàn giao cho GHN",
  SHIPPING: "GHN giao thành công",
  DELIVERED: "Hết hạn → tự hoàn thành",
};

// [DEV] chỉ hiện ở bản dev + khi đơn còn mock
export function OrderMockPanel({ order }) {
  const advance = useOrderMutation(ordersApi.mockAdvanceOrder);
  const expireReturn = useOrderMutation(ordersApi.mockExpireReturnWindow);
  const next = NEXT_STEP[order.status];
  const returnable = canRequestReturn(order);
  if (!__DEV__ || !MOCK.orderList || (!next && !returnable)) return null;
  return (
    <NoteBox>
      <View style={styles.wrap}>
        <Text style={styles.title}>Mock (chỉ bản dev)</Text>
        {next ? (
          <Button
            title={next}
            variant="text"
            loading={advance.isPending}
            onPress={() => advance.mutate(order.id)}
          />
        ) : null}
        {returnable ? (
          <Button
            title="Rút hạn trả hàng còn 1 phút"
            variant="text"
            loading={expireReturn.isPending}
            onPress={() => expireReturn.mutate(order.id)}
          />
        ) : null}
      </View>
    </NoteBox>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, alignItems: "flex-start" },
  title: { ...textStyles.label, color: colors.textSecondary },
});
