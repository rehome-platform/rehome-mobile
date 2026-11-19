import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme";

// Chữ "VNPAY" theo màu nhận diện của VNPay: "VN" đỏ, "PAY" xanh, trong khung trắng viền nhạt như các app thanh toán
// (Shopee, Tiki đặt logo cổng thanh toán cạnh từng lựa chọn). Dựng bằng chữ → không cần file ảnh, không build lại APK
const VNPAY_RED = "#E30019";
const VNPAY_BLUE = "#005BAA";

export function VnpayLogo({ size = 14 }) {
  return (
    <View style={styles.box} accessibilityLabel="VNPay">
      <Text style={[styles.word, { fontSize: size, lineHeight: size + 4 }]}>
        <Text style={{ color: VNPAY_RED }}>VN</Text>
        <Text style={{ color: VNPAY_BLUE }}>PAY</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  word: { fontFamily: fonts.bold, letterSpacing: 0.5 },
});
