import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { ENV } from "@/config/env";
import { ERROR_CODES } from "@/constants/errorCodes";
import { TRYON_LIVE_STATUS } from "@/constants/tryonLive";
import {
  useCompleteLiveTryon,
  useStartLiveTryon,
  useTryonLiveQuota,
} from "../hooks/useTryonLive";
import { TryonLiveWebview } from "../components/TryonLiveWebview";

// Thử đồ AI real-time qua camera (Decart Lucy VTON). BE đã trừ quota + mint token ngay ở
// POST /tryon/live/sessions (LiveTryOnServiceImpl) - màn hình này chỉ xin quyền camera, nhúng
// WebView chạy SDK Decart (tryonLiveHtml.js), đếm ngược cho người dùng thấy, rồi điều hướng
// sang màn kết quả khi WebView báo "done".
// Toàn bộ bước "connecting" (gọi BE mint token + WebView mở camera/kết nối Decart WebRTC) phải
// xong trong khoảng này, không thì coi như treo -> tự chuyển "error" thay vì xoay vô hạn.
// 25s để chừa chỗ cho WebRTC retry vài nhịp (token-ttl-seconds BE mặc định 30s) - 15s hay bị
// cắt ngang ngay lúc đang reconnect bình thường, nhất là lần đầu model Decart còn "lạnh".
const CONNECT_TIMEOUT_MS = 25000;

export default function LiveTryonScreen() {
  const { productId } = useLocalSearchParams();
  const quota = useTryonLiveQuota();
  const startSession = useStartLiveTryon();
  const completeSession = useCompleteLiveTryon();
  const [permission, requestPermission] = useCameraPermissions();

  // checking | permission | permission-denied | connecting | recording | no-quota | error
  const [phase, setPhase] = useState("checking");
  const [session, setSession] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [connectStatusText, setConnectStatusText] = useState("Đang kết nối AI...");
  const webviewRef = useRef(null);
  const countdownRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const sessionRef = useRef(null);
  const startedRef = useRef(false); // chặn bấm "Mở camera" 2 lần gọi startSession 2 lần

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!quota.data || phase !== "checking") return;
    setPhase(quota.data.remaining <= 0 ? "no-quota" : "permission");
  }, [quota.data, phase]);

  useEffect(() => () => clearInterval(countdownRef.current), []);
  useEffect(() => () => clearTimeout(connectTimeoutRef.current), []);

  const clearConnectTimeout = () => {
    clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = null;
  };

  const failConnecting = (message) => {
    clearConnectTimeout();
    webviewRef.current?.stop();
    if (sessionRef.current) {
      completeSession.mutate({
        sessionId: sessionRef.current.sessionId,
        status: TRYON_LIVE_STATUS.FAILED,
        actualDurationSeconds: 0,
      });
    }
    startedRef.current = false;
    setErrorMessage(message);
    setPhase("error");
  };

  const close = () =>
    router.canGoBack() ? router.back() : router.replace(`/products/${productId}`);

  const begin = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setPhase("permission-denied");
        return;
      }
    }
    if (startedRef.current) return;
    startedRef.current = true;
    setConnectStatusText("Đang kết nối AI...");
    setPhase("connecting");
    connectTimeoutRef.current = setTimeout(
      () => failConnecting("Kết nối AI quá lâu, vui lòng thử lại."),
      CONNECT_TIMEOUT_MS,
    );
    startSession.mutate(productId, {
      onSuccess: async (data) => {
        const accessToken = await tokenStorage.getAccessToken();
        setSession({ ...data, accessToken });
      },
      onError: (e) => {
        clearConnectTimeout();
        startedRef.current = false;
        if (e.code === ERROR_CODES.TRYON_LIVE_QUOTA_EXCEEDED) {
          setPhase("no-quota");
        } else {
          setErrorMessage(e.message);
          setPhase("error");
        }
      },
    });
  };

  const onWebviewReady = () => {
    if (!session) return;
    webviewRef.current?.start({
      apiKey: session.apiKey,
      modelId: session.modelId,
      garmentImageUrl: session.garmentImageUrl,
      prompt: session.prompt,
      maxDurationSeconds: session.maxDurationSeconds,
      apiBaseUrl: ENV.API_BASE_URL,
      accessToken: session.accessToken,
      sessionId: session.sessionId,
    });
  };

  const startCountdown = (seconds) => {
    clearConnectTimeout();
    clearInterval(countdownRef.current); // phòng hờ nếu lỡ có "recording-started" bắn 2 lần
    setSecondsLeft(seconds);
    setPhase("recording");
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const onEvent = (event) => {
    if (event.type === "status") {
      // WebRTC đang tự retry (connecting/reconnecting) - cho người xem thấy app vẫn đang chạy,
      // không phải đứng hình, nhất là lúc demo trực tiếp.
      setConnectStatusText(
        event.state === "reconnecting"
          ? "Mất kết nối, đang thử lại..."
          : "Đang kết nối AI...",
      );
      return;
    }
    if (event.type === "recording-started") {
      if (phase === "recording") return; // đã đếm ngược rồi - bỏ qua event trùng
      startCountdown(session.maxDurationSeconds);
      return;
    }
    if (event.type === "done") {
      clearInterval(countdownRef.current);
      router.replace({
        pathname: "/tryon-live/result",
        params: { videoUrl: event.videoUrl, productId },
      });
      return;
    }
    if (event.type === "error") {
      clearInterval(countdownRef.current);
      clearConnectTimeout();
      // Không có video để BE tự đánh dấu COMPLETED -> tự báo FAILED để audit (không hoàn quota)
      if (session) {
        const elapsed = secondsLeft == null ? 0 : session.maxDurationSeconds - secondsLeft;
        completeSession.mutate({
          sessionId: session.sessionId,
          status: TRYON_LIVE_STATUS.FAILED,
          actualDurationSeconds: elapsed,
        });
      }
      setErrorMessage(event.message || "Không thể kết nối tới dịch vụ thử đồ AI.");
      setPhase("error");
    }
  };

  if (phase === "checking" || quota.isLoading) {
    return (
      <Screen style={styles.dark}>
        <ActivityIndicator style={styles.loading} color={colors.onPrimary} />
      </Screen>
    );
  }

  if (phase === "no-quota") {
    return (
      <Screen>
        <EmptyState
          icon="time-outline"
          title="Hết lượt thử đồ AI real-time hôm nay"
          description={`Mỗi tài khoản chỉ có ${quota.data?.dailyLimit ?? 2} lượt/ngày, mỗi lượt ${
            quota.data?.maxDurationSeconds ?? 10
          } giây. Quay lại vào ngày mai nhé.`}
        >
          <Button title="Đóng" variant="secondary" onPress={close} />
        </EmptyState>
      </Screen>
    );
  }

  if (phase === "permission-denied") {
    return (
      <Screen>
        <EmptyState
          icon="videocam-off-outline"
          title="Chưa được cấp quyền Camera"
          description="ReHome cần quyền Camera để thử đồ AI real-time. Mở Cài đặt để cấp quyền."
        >
          <Button title="Mở Cài đặt" onPress={() => Linking.openSettings()} />
          <Button title="Đóng" variant="secondary" onPress={close} style={styles.mt} />
        </EmptyState>
      </Screen>
    );
  }

  if (phase === "error") {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Không thể thử đồ AI lúc này"
          description={errorMessage}
        >
          <Button title="Đóng" variant="secondary" onPress={close} />
        </EmptyState>
      </Screen>
    );
  }

  if (phase === "permission") {
    return (
      <Screen>
        <EmptyState
          icon="camera-outline"
          title="Thử đồ AI real-time"
          description={`Mở camera, thử món này trực tiếp tối đa ${
            quota.data?.maxDurationSeconds ?? 10
          } giây. Còn ${quota.data?.remaining ?? 2} lượt hôm nay.`}
        >
          <Button title="Mở camera" onPress={begin} />
          <Button title="Để sau" variant="secondary" onPress={close} style={styles.mt} />
        </EmptyState>
      </Screen>
    );
  }

  // connecting | recording - toàn màn hình, không qua Screen() vì camera phải full-bleed
  return (
    <SafeAreaView style={styles.fill} edges={["top", "left", "right"]}>
      {session ? (
        <>
          <TryonLiveWebview ref={webviewRef} onEvent={onEvent} />
          <StartOnReady onReady={onWebviewReady} />
        </>
      ) : null}

      <Pressable
        onPress={() => webviewRef.current?.stop()}
        style={styles.close}
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        hitSlop={8}
      >
        <Ionicons name="close" size={22} color={colors.onPrimary} />
      </Pressable>

      {phase === "connecting" ? (
        <View style={styles.centerOverlay}>
          <ActivityIndicator color={colors.onPrimary} />
          <Text style={styles.overlayText}>{connectStatusText}</Text>
        </View>
      ) : null}

      {phase === "recording" && secondsLeft != null ? (
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>Còn lại: {secondsLeft}s</Text>
          <Text style={styles.countdownHint}>(để tránh tốn chi phí)</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// WebView chạy HTML tĩnh nhúng sẵn (không gọi mạng để load trang) nên "ready" gần như ngay lập
// tức - đợi 1 nhịp ngắn thay vì forward thêm 1 prop onLoadEnd xuyên qua forwardRef chỉ cho việc này.
function StartOnReady({ onReady }) {
  useEffect(() => {
    const t = setTimeout(onReady, 300);
    return () => clearTimeout(t);
  }, [onReady]);
  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  dark: { backgroundColor: "#000" },
  loading: { marginTop: spacing.xxl },
  mt: { marginTop: spacing.sm },
  close: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.input,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  overlayText: { ...textStyles.body, color: colors.onPrimary },
  countdown: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.input,
  },
  countdownText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
  countdownHint: { ...textStyles.caption, color: colors.onPrimary },
});
