import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { NoteBox } from "@/components/ui/NoteBox";
import { MODEL_TYPE_LABEL } from "@/constants/tryon";
import { outfitTitle } from "../utils/tryonRules";
import { useTryonProgress } from "../hooks/useTryonProgress";
import { TryonProgressBar } from "./TryonProgressBar";

// AI-03 · Đang tạo ảnh. Thanh % là ƯỚC LƯỢNG theo thời gian (BE không báo tiến độ — useTryonProgress), dùng chung
// với khung nổi TryonJobBanner để hai nơi luôn khớp số. (Đổi so với PHASE6_GUIDE 0.5 A2 "không thanh %": 13/11)
export function TryonWaiting({ job }) {
  const { percent, waitedSec } = useTryonProgress(job);
  const model = MODEL_TYPE_LABEL[job.payload.modelType]?.toLowerCase() ?? "";

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Đang ghép outfit lên người mẫu</Text>
        <View style={styles.progress}>
          <TryonProgressBar percent={percent} height={8} />
          <View style={styles.progressRow}>
            <Text style={styles.muted}>Đã chờ {waitedSec} giây</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>
        </View>
        <Text style={styles.muted}>
          Thường mất 20 – 40 giây. Bấm &quot;Chạy nền&quot; để xem món khác, thanh
          tiến độ vẫn hiện ở cuối màn hình và báo bạn khi xong.
        </Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.thumbs}>
          {job.items.map((it) => (
            <View key={it.id} style={styles.thumb}>
              {it.thumbnailUrl ? (
                <Image
                  source={{ uri: it.thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
          ))}
        </View>
        <Text style={styles.summaryText}>
          {outfitTitle(job.items)} trên người mẫu {model}
        </Text>
      </View>

      <NoteBox>
        Ảnh do mô hình AI dựng ra để bạn hình dung cách phối đồ. Không phản ánh
        form dáng và size thật khi mặc lên người bạn.
      </NoteBox>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  box: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.card,
  },
  title: { ...textStyles.heading, color: colors.text, textAlign: "center" },
  muted: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  progress: { alignSelf: "stretch", gap: spacing.xs },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  percent: {
    ...textStyles.heading,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  thumbs: { flexDirection: "row", gap: spacing.xs },
  thumb: {
    width: 44,
    height: 44,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  summaryText: { flex: 1, ...textStyles.caption, color: colors.textSecondary },
});
