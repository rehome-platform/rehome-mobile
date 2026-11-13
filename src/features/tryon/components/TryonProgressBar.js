import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";

// Thanh tiến độ mảnh, chạy mượt giữa các lần cập nhật % (dùng ở khung nổi và màn "Đang tạo ảnh")
export function TryonProgressBar({ percent, height = 6, color = colors.primary }) {
  const value = useRef(new Animated.Value(percent)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: percent,
      duration: 300,
      useNativeDriver: false, // width không chạy bằng native driver
    }).start();
  }, [percent]);

  const width = value.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <Animated.View
        style={[
          styles.fill,
          { width, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    backgroundColor: colors.neutral,
    borderRadius: radius.pill,
  },
  fill: { height: "100%" },
});
