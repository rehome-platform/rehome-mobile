import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow, spacing, textStyles, tones } from "@/theme";
import { TRYON_JOB_STATUS as J } from "@/constants/tryon";
import { useTryonJobStore } from "@/stores/tryonJobStore";
import { useTryonProgress } from "../hooks/useTryonProgress";
import { TryonProgressBar } from "./TryonProgressBar";

// Khung nổi "AI đang tạo ảnh thử đồ" — gắn ở layout gốc nên hiện trên MỌI màn: người dùng đi xem món khác,
// vào giỏ, sang tab khác… thanh % vẫn chạy. Xong → đổi sang "Đã xong · Xem ảnh"; lỗi → "Bấm để thử lại".
// Ẩn khi đang đứng ở phòng thử đồ (màn đó đã có khung chờ riêng, xong tự chuyển sang kết quả).
// Nằm phía dưới, cao hơn thanh tab / nút cố định ở đáy để không che nút ← và tiêu đề.
const BOTTOM_OFFSET = 88; // ≈ chiều cao thanh tab hoặc khung nút cố định đáy màn (Screen footer)

export function TryonJobBanner() {
  const job = useTryonJobStore((s) => s.job);
  const watching = useTryonJobStore((s) => s.watching);
  const clear = useTryonJobStore((s) => s.clear);
  const insets = useSafeAreaInsets();
  const { percent } = useTryonProgress(job);

  if (!job || watching) return null;

  const running = job.status === J.RUNNING;
  const done = job.status === J.DONE;
  const thumb = job.items?.[0]?.thumbnailUrl;
  const productId = job.items?.[0]?.id;

  const onPress = () => {
    if (done) {
      const id = job.resultId;
      clear();
      router.push(`/tryon/result/${id}`);
      return;
    }
    // Đang chạy / lỗi → phòng thử đồ (màn tự hiện khung chờ hoặc lỗi + Thử lại theo job)
    router.push(productId ? `/tryon?productId=${productId}` : "/tryon");
  };

  const title = running
    ? "AI đang tạo ảnh thử đồ"
    : done
      ? "Ảnh thử đồ đã xong"
      : "Chưa tạo được ảnh thử đồ";
  const sub = running
    ? "Bạn cứ xem món khác, xong sẽ báo"
    : done
      ? "Bấm để xem ảnh"
      : "Bấm để xem lỗi và thử lại";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + BOTTOM_OFFSET }]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${running ? `${percent}%` : sub}`}
        style={({ pressed }) => [
          styles.card,
          done && styles.cardDone,
          !running && !done && styles.cardError,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.row}>
          <View style={styles.thumb}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} />
            ) : null}
            {!running ? (
              <View style={styles.thumbIcon}>
                <Ionicons
                  name={done ? "checkmark-circle" : "alert-circle"}
                  size={22}
                  color={done ? colors.primary : colors.error}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {sub}
            </Text>
          </View>
          {running ? (
            <Text style={styles.percent}>{percent}%</Text>
          ) : (
            <Pressable
              onPress={clear}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        {running ? <TryonProgressBar percent={percent} height={4} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.lg, right: spacing.lg },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
    elevation: 6, // nổi trên nội dung (shadow.card chỉ 2)
  },
  cardDone: { borderColor: colors.primary, backgroundColor: tones.success.bg },
  cardError: { borderColor: colors.error, backgroundColor: tones.danger.bg },
  pressed: { opacity: 0.9 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: {
    width: 40,
    height: 40,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  thumbIcon: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlayLight,
  },
  body: { flex: 1 },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  sub: { ...textStyles.caption, color: colors.textSecondary },
  percent: {
    ...textStyles.heading,
    fontFamily: fonts.bold,
    color: colors.primary,
    minWidth: 44,
    textAlign: "right",
  },
});
