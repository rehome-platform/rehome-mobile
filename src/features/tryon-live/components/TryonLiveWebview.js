import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { TRYON_LIVE_HTML } from "../webview/tryonLiveHtml";

// Bọc WebView chạy trang Decart (tryonLiveHtml.js). Chỉ lo việc nhúng + gửi/nhận postMessage;
// mọi quyết định (đếm ngược, điều hướng khi xong...) do LiveTryonScreen quyết, không đặt ở đây.
export const TryonLiveWebview = forwardRef(function TryonLiveWebview(
  { onEvent },
  ref,
) {
  const webviewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    // Gọi sau khi WebView đã load xong (onLoadEnd) để bắt đầu phiên
    start: (config) =>
      webviewRef.current?.postMessage(JSON.stringify({ type: "start", ...config })),
    // Dừng sớm (nút Đóng) - trang vẫn tự upload phần đã quay được rồi mới báo "done"/"error"
    stop: () => webviewRef.current?.postMessage(JSON.stringify({ type: "stop" })),
  }));

  return (
    <WebView
      ref={webviewRef}
      source={{ html: TRYON_LIVE_HTML, baseUrl: "https://rehome-mobile.app" }}
      style={styles.fill}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mediaCapturePermissionGrantedAndroid
      mediaCapturePermissionGrantType="grant"
      onMessage={(event) => {
        try {
          onEvent?.(JSON.parse(event.nativeEvent.data));
        } catch {
          // bỏ qua message không parse được
        }
      }}
    />
  );
});

const styles = StyleSheet.create({ fill: { flex: 1 } });
