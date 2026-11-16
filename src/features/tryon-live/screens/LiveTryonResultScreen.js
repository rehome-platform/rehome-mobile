import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Asset } from "expo-media-library";
import * as MediaLibrary from "expo-media-library";
import { DownloadTask, File, Paths } from "expo-file-system";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/utils/toast";
import { spacing } from "@/theme";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// Xem lại + tải về video thử đồ AI real-time 10s vừa quay xong (BE đã lưu, videoUrl công khai)
export default function LiveTryonResultScreen() {
  const { videoUrl, productId } = useLocalSearchParams();
  const [downloading, setDownloading] = useState(false);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  const download = async () => {
    setDownloading(true);
    try {
      // writeOnly = true: chỉ LƯU video vào thư viện, không đọc ảnh/video/âm thanh của máy.
      // Không truyền thì thư viện xin cả quyền đọc ảnh + video + âm thanh, và ném lỗi nếu bản
      // build không khai báo đủ trong AndroidManifest (vd. READ_MEDIA_AUDIO).
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          "Chưa được cấp quyền",
          "ReHome cần quyền lưu ảnh/video để tải video thử đồ về máy.",
        );
        return;
      }
      // Android quay ra .webm, iPhone quay ra .mp4 - lấy đuôi theo đúng file BE đã lưu
      const ext = /\.mp4(\?|$)/i.test(String(videoUrl)) ? "mp4" : "webm";
      const destination = new File(Paths.cache, `tryon-live-${Date.now()}.${ext}`);
      const downloaded = await new DownloadTask(videoUrl, destination).downloadAsync();
      if (!downloaded) throw new Error("Tải video thất bại.");
      await Asset.create(downloaded.uri);
      showToast("Đã lưu video vào thư viện ảnh");
    } catch (e) {
      Alert.alert("Chưa tải được video", e.message ?? "Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  };

  const retry = () => router.replace(`/tryon-live/${productId}`);

  return (
    <Screen header={<AppHeader title="Video thử đồ AI" onBack={goBack} />} padded={false}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      <View style={styles.actions}>
        <Button title="Tải về" onPress={download} loading={downloading} />
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={retry}
          style={styles.mt}
        />
        <Button title="Đóng" variant="text" onPress={goBack} style={styles.mt} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  video: { width: "100%", aspectRatio: 9 / 16, backgroundColor: "#000" },
  actions: { padding: spacing.lg },
  mt: { marginTop: spacing.sm },
});
