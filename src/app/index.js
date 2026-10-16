import { Text, View } from "react-native";
import { colors, textStyles } from "@/theme";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={[textStyles.title, { color: colors.primary }]}>
        ReHome — Be Vietnam Pro
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary }]}>
        Tiếng Việt có dấu: Ký gửi · Mua sắm · Quyên góp
      </Text>
    </View>
  );
}
