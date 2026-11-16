import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, textStyles } from "@/theme";

// Xem ảnh phóng to toàn màn hình, vuốt ngang qua lại giữa các ảnh. photos: mảng URL; index: ảnh mở đầu tiên
// (null = đóng). Dùng chung: ảnh hiện vật quyên góp, có thể dùng cho ảnh khác sau này
export function PhotoViewer({ photos = [], index, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  useEffect(() => {
    if (index != null) setCurrent(index);
  }, [index]);

  return (
    <Modal
      visible={index != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(u, i) => `${u}-${i}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={{ width, height }}
              resizeMode="contain"
            />
          )}
        />
        <View style={[styles.top, { top: insets.top + spacing.sm }]}>
          <Text style={styles.count}>
            {photos.length > 1 ? `${current + 1} / ${photos.length}` : ""}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            style={styles.close}
          >
            <Ionicons name="close" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000" },
  top: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: { ...textStyles.body, color: colors.onPrimary },
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.overlay,
  },
});
