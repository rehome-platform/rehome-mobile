import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

const GAP = spacing.xs;

function Photo({ uri, width, height, more = 0 }) {
  return (
    <View style={[styles.photo, { width, height }]}>
      <Image source={{ uri }} style={{ width, height }} />
      {more > 0 ? (
        <View style={styles.more}>
          <Text style={styles.moreText}>+{more}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Ảnh bài viết, xếp kiểu Facebook:
// 1 ảnh: to 4:3 · 2 ảnh: 2 ô vuông cạnh nhau · 3 ảnh: 1 to trên + 2 vuông dưới · ≥ 4: lưới 2×2, ô cuối "+n".
// Đo bề ngang thật (onLayout) rồi dựng từng hàng bằng số cụ thể — không dùng % / flexWrap
// (trên Android ô theo % có lúc không vẽ ảnh, tổng 2 ô làm tròn lớn hơn khung → rớt xuống dòng)
export function PostPhotos({ urls }) {
  const [width, setWidth] = useState(0);
  if (!urls?.length) return null;

  const half = Math.floor((width - GAP) / 2);
  const pair = (list, more = 0) => (
    <View style={styles.row}>
      {list.map((u, i) => (
        <Photo
          key={`${u}-${i}`}
          uri={u}
          width={half}
          height={half}
          more={i === list.length - 1 ? more : 0}
        />
      ))}
    </View>
  );

  let content = null;
  if (width > 0) {
    if (urls.length === 1) {
      content = <Photo uri={urls[0]} width={width} height={(width * 3) / 4} />;
    } else if (urls.length === 2) {
      content = pair(urls);
    } else if (urls.length === 3) {
      content = (
        <>
          <Photo uri={urls[0]} width={width} height={(width * 9) / 16} />
          {pair(urls.slice(1))}
        </>
      );
    } else {
      content = (
        <>
          {pair(urls.slice(0, 2))}
          {pair(urls.slice(2, 4), urls.length - 4)}
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
