import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

// Hàng ảnh nhỏ; bấm → xem to (bấm bất kỳ đâu / nút Back để đóng)
export function PhotoThumbs({ urls }) {
  const [open, setOpen] = useState(null);
  if (!urls?.length) return null;
  return (
    <>
      <View style={styles.row}>
        {urls.map((u, i) => (
          <Pressable
            key={`${u}-${i}`}
            onPress={() => setOpen(u)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Xem ảnh ${i + 1}`}
            style={styles.thumb}
          >
            <Image source={{ uri: u }} style={StyleSheet.absoluteFill} />
          </Pressable>
        ))}
      </View>
      <Modal
        visible={!!open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(null)}
          accessibilityLabel="Đóng ảnh"
        >
          {open ? (
            <Image
              source={{ uri: open }}
              style={styles.full}
              resizeMode="contain"
            />
          ) : null}
          <Ionicons
            name="close"
            size={28}
            color={colors.surface}
            style={styles.close}
          />
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  full: { width: "100%", height: "80%" },
  close: { position: "absolute", top: spacing.xxl, right: spacing.lg },
});
