import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme";
import { usePhotoViewer } from "./PhotoViewer";

// Ảnh đại diện tròn; chưa có ảnh → chữ cái đầu trên nền primary
// initialOf: "last" — tên người VN, lấy chữ đầu của TÊN ("Nguyễn Văn An" → "A")
//            "first" — tên tổ chức, lấy chữ đầu của từ đầu ("Mái ấm Hoa Hồng" → "M")
// viewable: bấm ảnh → xem to toàn màn hình. Chỉ bật ở đầu trang hồ sơ (của mình / tổ chức);
// ở thẻ, danh sách, bình luận thì bấm avatar là mở hồ sơ nên KHÔNG bật (giống Facebook)
export function Avatar({
  uri,
  name = "",
  size = 56,
  initialOf = "last",
  viewable = false,
}) {
  const { open, viewer } = usePhotoViewer();
  const words = name.trim().split(/\s+/);
  const word = initialOf === "first" ? words[0] : words[words.length - 1];
  const initial = word?.charAt(0).toUpperCase() || "?";
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    const image = (
      <Image
        source={{ uri }}
        style={[box, styles.image]}
        accessibilityIgnoresInvertColors
      />
    );
    if (!viewable) return image;
    return (
      <>
        <Pressable
          onPress={() => open([uri])}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Xem ảnh đại diện ${name}`}
        >
          {image}
        </Pressable>
        {viewer}
      </>
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
