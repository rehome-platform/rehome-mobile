import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Bong bóng tin: của mình bên phải (nền đậm), đối tác bên trái. Đang gửi / lỗi "Gửi lại".
// Ảnh đính kèm (imageUrls) hiện phía trên chữ; bấm ảnh để xem to. Chữ BE đã che SĐT / email / STK thành "***"
export function MessageBubble({ message: m, onRetry }) {
  const mine = m.isMine;
  const images = m.imageUrls ?? [];
  const [viewing, setViewing] = useState(null); // uri ảnh đang xem to
  return (
    <View style={[styles.wrap, mine ? styles.right : styles.left]}>
      {images.length ? (
        <View style={[styles.images, mine ? styles.imagesRight : null]}>
          {images.map((uri) => (
            <Pressable
              key={uri}
              onPress={() => setViewing(uri)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Xem ảnh"
            >
              <Image
                source={{ uri }}
                style={[
                  images.length === 1 ? styles.imageSingle : styles.image,
                  m.failed && styles.failed,
                ]}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
      {m.content ? (
        <View
          style={[
            styles.bubble,
            mine ? styles.mine : styles.theirs,
            m.failed && styles.failed,
          ]}
        >
          <Text style={mine ? styles.textMine : styles.text}>{m.content}</Text>
        </View>
      ) : null}
      {m.failed ? (
        <Pressable
          onPress={() => onRetry?.(m)}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.error}>Chưa gửi được · Gửi lại</Text>
        </Pressable>
      ) : (
        <Text style={styles.time}>
          {m.pending ? "Đang gửi…" : dayjs(m.createdAt).format("HH:mm")}
        </Text>
      )}

      <Modal
        visible={!!viewing}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewing(null)}>
          {viewing ? (
            <Image
              source={{ uri: viewing }}
              style={styles.full}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.close}>
            <Ionicons name="close" size={28} color={colors.onPrimary} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: "80%", gap: 2, marginVertical: spacing.xs },
  right: { alignSelf: "flex-end", alignItems: "flex-end" },
  left: { alignSelf: "flex-start", alignItems: "flex-start" },
  images: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  imagesRight: { justifyContent: "flex-end" },
  imageSingle: { width: 200, height: 200, borderRadius: radius.card },
  image: { width: 110, height: 110, borderRadius: radius.input },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  mine: { backgroundColor: colors.primary },
  theirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  failed: { opacity: 0.6 },
  text: { ...textStyles.body, color: colors.text },
  textMine: { ...textStyles.body, color: colors.onPrimary },
  time: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  viewer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  full: { width: "100%", height: "80%" },
  close: { position: "absolute", top: 48, right: 20 },
});
