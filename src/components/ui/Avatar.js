import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme";

// Ảnh đại diện tròn; chưa có ảnh
// initialOf: "last" — tên người VN, lấy chữ đầu của TÊN ("Nguyễn Văn An" → "A")
//            "first" — tên tổ chức, lấy chữ đầu của từ đầu ("Mái ấm Hoa Hồng" → "M")
export function Avatar({ uri, name = "", size = 56, initialOf = "last" }) {
  const words = name.trim().split(/\s+/);
  const word = initialOf === "first" ? words[0] : words[words.length - 1];
  const initial = word?.charAt(0).toUpperCase() || "?";

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
