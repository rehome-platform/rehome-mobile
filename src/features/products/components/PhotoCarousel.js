import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Ảnh lướt ngang từng ảnh + số trang "1/3". dimmed: món không còn bán; label: nhãn góc trên ("ĐÃ BÁN")
export function PhotoCarousel({ photos = [], dimmed = false, label }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const size = { width, height: width }; // ảnh vuông, kín chiều ngang

  return (
    <View style={[styles.wrap, size]}>
      {photos.length ? (
        <FlatList
          data={photos}
          keyExtractor={(p, i) => `${i}-${p.url}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={size} resizeMode="cover" />
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons
            name="shirt-outline"
            size={48}
            color={colors.textSecondary}
          />
        </View>
      )}
      {dimmed ? <View style={styles.dim} pointerEvents="none" /> : null}
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {photos.length > 1 ? (
        <Text style={styles.counter}>
          {index + 1}/{photos.length}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.neutral },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  label: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.text,
    color: colors.surface,
    ...textStyles.label,
    fontFamily: fonts.bold,
  },
  counter: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: colors.onPrimary,
    ...textStyles.caption,
  },
});
