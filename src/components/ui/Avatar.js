import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme";

// Ảnh đại diện tròn; chưa có ảnh
export function Avatar({ uri, name = "", size = 56 }) {
  const initial =
    name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || "?";
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[box, styles.image]}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={[box, styles.fallback]}
      accessibilityLabel={`Ảnh đại diện ${name}`}
    >
      <Text
        style={[
          styles.initial,
          { fontSize: size * 0.4, lineHeight: size * 0.5 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.neutral },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  initial: { fontFamily: fonts.bold, color: colors.onPrimary },
});
