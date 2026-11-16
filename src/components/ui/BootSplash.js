import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";

const logo = require("../../../assets/logo/logo.png"); // assets nằm ngoài src nên không dùng @/

// AU-01: màn chờ lúc mở app, trong khi khôi phục phiên đăng nhập (server Render ngủ có thể mất vài chục giây)
export function BootSplash() {
  return (
    <View style={styles.wrap} accessibilityLabel="Đang kiểm tra đăng nhập">
      <Image
        source={logo}
        style={styles.logo}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        accessibilityLabel="ReHome"
      />

      <View style={styles.bottom}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Đang kiểm tra đăng nhập…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  logo: { width: 240, height: 52 },
  bottom: {
    position: "absolute",
    bottom: 64,
    alignItems: "center",
    gap: spacing.sm,
  },
  text: { ...textStyles.caption, color: colors.textSecondary },
});
