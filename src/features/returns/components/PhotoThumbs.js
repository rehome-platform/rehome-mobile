import { Image, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { usePhotoViewer } from "@/components/ui/PhotoViewer";

// Hàng ảnh nhỏ; bấm → xem to bằng trình xem ảnh chung (nút X đóng, vuốt qua ảnh khác, Back để đóng)
export function PhotoThumbs({ urls }) {
  const photos = usePhotoViewer();
  if (!urls?.length) return null;
  return (
    <>
      <View style={styles.row}>
        {urls.map((u, i) => (
          <Pressable
            key={`${u}-${i}`}
            onPress={() => photos.open(urls, i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Xem ảnh ${i + 1}`}
            style={styles.thumb}
          >
            <Image source={{ uri: u }} style={StyleSheet.absoluteFill} />
          </Pressable>
        ))}
      </View>
      {photos.viewer}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: {
    width: 72,
    height: 72,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
});
