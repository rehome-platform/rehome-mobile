import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// 1 ảnh: lớn 4:3 · 2–4 ảnh: lưới 2 cột vuông · hơn 4: ô cuối "+n"
export function PostPhotos({ urls }) {
  if (!urls?.length) return null;
  if (urls.length === 1) {
    return <Image source={{ uri: urls[0] }} style={styles.single} />;
  }
  const shown = urls.slice(0, 4);
  const more = urls.length - shown.length;
  return (
    <View style={styles.grid}>
      {shown.map((u, i) => (
        <View key={`${u}-${i}`} style={styles.cell}>
          <Image source={{ uri: u }} style={StyleSheet.absoluteFill} />
          {more > 0 && i === shown.length - 1 ? (
            <View style={styles.more}>
              <Text style={styles.moreText}>+{more}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  single: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xs,
  },
  cell: {
    width: "49.3%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },

  more: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    opacity: 0.7,
  },
  moreText: {
    ...textStyles.title,
    fontFamily: fonts.bold,
    color: colors.surface,
  },
});
