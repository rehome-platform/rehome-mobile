import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { usePhotoViewer } from "@/components/ui/PhotoViewer";

// Bong bóng tin: của mình bên phải (nền đậm), đối tác bên trái. Đang gửi / lỗi "Gửi lại".
// Ảnh đính kèm (imageUrls) hiện phía trên chữ; bấm ảnh để xem to. Chữ BE đã che SĐT / email / STK thành "***"
// Từ ngữ vi phạm: BE vẫn gửi tin nhưng che bằng "*" (content); originalContent là bản gốc → mặc định hiện bản che,
// dưới bong bóng có dòng "Đã che từ ngữ không phù hợp · Xem" để tự bấm xem / "Ẩn lại" (cả người gửi lẫn người nhận)
export function MessageBubble({ message: m, onRetry }) {
  const mine = m.isMine;
  const images = m.imageUrls ?? [];
  const photos = usePhotoViewer(); // bấm ảnh → xem to (nút X, vuốt qua ảnh khác trong cùng tin)
  const [revealed, setRevealed] = useState(false);
  const masked = !!m.originalContent && m.originalContent !== m.content;
  const text = masked && revealed ? m.originalContent : m.content;
  return (
    <View style={[styles.wrap, mine ? styles.right : styles.left]}>
      {images.length ? (
        <View style={[styles.images, mine ? styles.imagesRight : null]}>
          {images.map((uri, i) => (
            <Pressable
              key={uri}
              onPress={() => photos.open(images, i)}
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
          <Text style={mine ? styles.textMine : styles.text}>{text}</Text>
        </View>
      ) : null}
      {masked ? (
        <Pressable
          onPress={() => setRevealed((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            revealed ? "Ẩn lại từ ngữ không phù hợp" : "Xem tin gốc"
          }
          style={styles.maskRow}
        >
          <Ionicons
            name={revealed ? "eye-off-outline" : "eye-outline"}
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.maskText}>
            {revealed ? "Ẩn lại" : "Đã che từ ngữ không phù hợp · "}
            {revealed ? null : <Text style={styles.maskLink}>Xem</Text>}
          </Text>
        </Pressable>
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

      {photos.viewer}
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
  maskRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  maskText: { ...textStyles.caption, color: colors.textSecondary },
  maskLink: {
    fontFamily: fonts.semibold,
    color: colors.accent,
    textDecorationLine: "underline",
  },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
});
