import { Text, View } from "react-native";
import { colors } from "@/theme/colors";

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
      <Text style={{ color: colors.primary }}>ReHome — alias @/ OK</Text>
    </View>
  );
}
