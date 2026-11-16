import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { daysLeft } from "@/utils/consignment";

// Sau khi chọn "Nhận lại hàng": đến địa điểm ký gửi trước hạn, đọc mã Member. Dùng ở KG-11 (kết quả) và KG-09.
// Hạn lấy từ BE (pickupDeadline — số ngày do Admin cấu hình), KHÔNG tự cộng; BE chưa trả thì không hiện ngày
export function PickupInfo({ product }) {
  const due =
    product.endOfTermDecision?.pickupDeadline ??
    product.degradedCase?.pickupDeadline ?? // Phase 5: nhận lại món hỏng (BE hiện chưa có hạn riêng)
    null;
  const left = due ? daysLeft(due) : null;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Nhận lại hàng — miễn phí</Text>
      <Text style={styles.body}>
        Đến <Text style={styles.bold}>{product.warehouseName}</Text>
        {due ? (
          <>
            {" "}
            trước{" "}
            <Text style={styles.bold}>{dayjs(due).format("DD/MM/YYYY")}</Text>
            {left != null && left >= 0 ? ` (còn ${left} ngày)` : ""}
          </>
        ) : null}
        . Đọc mã Member tại quầy để nhận hàng. Không tính phí rút hàng.
      </Text>
      <Button
        title="Mã Member của tôi"
        onPress={() => router.push("/profile/member-code")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  title: { ...textStyles.heading, color: colors.text },
  body: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
