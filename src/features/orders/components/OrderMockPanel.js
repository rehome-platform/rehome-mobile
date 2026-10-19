import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
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
  if (!__DEV__ || !MOCK.orderList || !NEXT_STEP[order.status]) return null;
  return (
    <NoteBox>
      <View style={styles.wrap}>
        <Text style={styles.title}>
          Mock (chỉ bản dev): đẩy đơn sang bước kế
        </Text>
        <Button
          title={NEXT_STEP[order.status]}
          variant="text"
          loading={advance.isPending}
          onPress={() => advance.mutate(order.id)}
        />
      </View>
    </NoteBox>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, alignItems: "flex-start" },
  title: { ...textStyles.label, color: colors.textSecondary },
});
