import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { NoteBox } from "@/components/ui/NoteBox";
import { MODEL_TYPE_LABEL } from "@/constants/tryon";
import { outfitTitle } from "../utils/tryonRules";

// AI-03 · Đang tạo ảnh. Chỉ đếm giây đã chờ — không thanh %/bước giả (PHASE6_GUIDE 0.5 A2)
export function TryonWaiting({ job }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const waited = Math.max(0, Math.floor((now - job.startedAt) / 1000));
  const model = MODEL_TYPE_LABEL[job.payload.modelType]?.toLowerCase() ?? "";

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Đang ghép outfit lên người mẫu</Text>
        <Text style={styles.muted}>
          Thường mất 20 – 40 giây. Bạn có thể để màn hình mở hoặc chạy nền rồi
          xem món khác.
        </Text>
        <Text style={styles.waited}>Đã chờ {waited} giây</Text>
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
  waited: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
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
