import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { usePhotoViewer } from "@/components/ui/PhotoViewer";

const GAP = spacing.xs;

function Photo({ uri, width, height, more = 0, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="imagebutton"
      accessibilityLabel={more > 0 ? `Xem thêm ${more} ảnh` : "Xem ảnh"}
      style={[styles.photo, { width, height }]}
    >
      <Image source={{ uri }} style={{ width, height }} />
      {more > 0 ? (
        <View style={styles.more}>
          <Text style={styles.moreText}>+{more}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// Ảnh bài viết, xếp kiểu Facebook:
// 1 ảnh: to 4:3 · 2 ảnh: 2 ô vuông cạnh nhau · 3 ảnh: 1 to trên + 2 vuông dưới · ≥ 4: lưới 2×2, ô cuối "+n".
// Đo bề ngang thật (onLayout) rồi dựng từng hàng bằng số cụ thể — không dùng % / flexWrap
// (trên Android ô theo % có lúc không vẽ ảnh, tổng 2 ô làm tròn lớn hơn khung → rớt xuống dòng).
// Bấm ảnh → xem toàn màn hình, vuốt qua mọi ảnh của bài (ô "+n" mở từ ảnh thứ 4)
export function PostPhotos({ urls }) {
  const [width, setWidth] = useState(0);
  const { open, viewer } = usePhotoViewer();
  if (!urls?.length) return null;

  const show = (i) => () => open(urls, i);
  const half = Math.floor((width - GAP) / 2);
  // start: vị trí ảnh đầu của hàng trong urls
  const pair = (list, start, more = 0) => (
    <View style={styles.row}>
      {list.map((u, i) => (
        <Photo
          key={`${u}-${i}`}
          uri={u}
          width={half}
          height={half}
          more={i === list.length - 1 ? more : 0}
          onPress={show(start + i)}
        />
      ))}
    </View>
  );

  let content = null;
  if (width > 0) {
    if (urls.length === 1) {
      content = (
        <Photo
          uri={urls[0]}
          width={width}
          height={(width * 3) / 4}
          onPress={show(0)}
        />
      );
    } else if (urls.length === 2) {
      content = pair(urls, 0);
    } else if (urls.length === 3) {
      content = (
        <>
          <Photo
            uri={urls[0]}
            width={width}
            height={(width * 9) / 16}
            onPress={show(0)}
          />
          {pair(urls.slice(1), 1)}
        </>
      );
    } else {
      content = (
        <>
          {pair(urls.slice(0, 2), 0)}
          {pair(urls.slice(2, 4), 2, urls.length - 4)}
        </>
      );
    }
  }

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.wrapper}
    >
      {content}
      {viewer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", gap: GAP },
  row: { flexDirection: "row", justifyContent: "space-between" },
  photo: {
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  more: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },
  moreText: {
    ...textStyles.title,
    fontFamily: fonts.bold,
    color: colors.surface,
  },
});
