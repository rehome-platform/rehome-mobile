import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Asset } from "expo-media-library";
import * as MediaLibrary from "expo-media-library";
import { DownloadTask, File, Paths } from "expo-file-system";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/utils/toast";
import { colors, spacing } from "@/theme";
import { useDeleteLiveTryon } from "../hooks/useTryonLive";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

// Xem lại + tải về / xoá video thử đồ AI real-time 10s vừa quay xong (BE đã lưu, videoUrl công khai).
// Nút thùng rác trên header (giống màn ảnh thử đồ): xoá khỏi lịch sử, không hoàn lượt đã dùng
export default function LiveTryonResultScreen() {
  const { videoUrl, productId, sessionId } = useLocalSearchParams();
  const [downloading, setDownloading] = useState(false);
  const remove = useDeleteLiveTryon();
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

  const confirmDelete = () =>
    Alert.alert(
      "Xoá video thử đồ này?",
      "Video biến mất khỏi lịch sử, không khôi phục được và không hoàn lại lượt đã dùng. Video đã tải về máy vẫn còn.",
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Xoá video",
          style: "destructive",
          onPress: () => {
            player.pause();
            remove.mutate(sessionId, {
              onSuccess: () => {
                showToast("Đã xoá video thử đồ");
                goBack();
              },
              onError: (e) => {
                // 404: video đã bị xoá trước đó (vd. ở máy khác) → coi như xong
                if (e.status === 404) {
                  showToast("Video này không còn nữa");
                  return goBack();
                }
                player.play();
                Alert.alert("Chưa xoá được video", e.message ?? "Vui lòng thử lại.");
              },
            });
          },
        },
      ],
    );

  const header = (
    <AppHeader
      title="Video thử đồ AI"
      onBack={goBack}
      right={
        sessionId ? (
          <Pressable
            onPress={confirmDelete}
            disabled={remove.isPending}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xoá video"
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={remove.isPending ? colors.textSecondary : colors.text}
            />
          </Pressable>
        ) : null
      }
    />
  );

  return (
    <Screen header={header} padded={false}>
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
