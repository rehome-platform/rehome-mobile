// Trang chạy BÊN TRONG react-native-webview, không qua Metro bundler → load Decart Web SDK
// qua jsdelivr "+esm" (CDN serve lại gói npm @decartai/sdk dưới dạng ES module cho browser),
// vì Decart chưa có SDK React Native / UMD script tag chính thức (chỉ có npm ESM + SDK native
// Android/Swift riêng). Không có secret nào nằm sẵn trong HTML này: apiKey là CLIENT TOKEN ngắn
// hạn, chỉ được RN truyền vào SAU khi WebView load xong, qua postMessage (xem TryonLiveWebview.js).
//
// Luồng: getUserMedia -> client.realtime.connect(...) -> nhận remote stream đã "mặc đồ" qua
// onRemoteStream -> vừa render vào <video>, vừa MediaRecorder lại để quay. Hết maxDurationSeconds
// (hoặc RN gửi "stop") -> dừng recorder + disconnect -> tự upload video thẳng tới BE (multipart,
// kèm bearer token RN truyền vào) -> báo RN qua postMessage({type:"done", videoUrl}).
const DECART_SDK_URL = "https://cdn.jsdelivr.net/npm/@decartai/sdk@0.2.14/+esm";

export const TRYON_LIVE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  #output { width: 100%; height: 100%; object-fit: cover; }
  #status {
    position: fixed; left: 0; right: 0; top: 50%; transform: translateY(-50%);
    text-align: center; color: #fff; font-family: sans-serif; font-size: 14px;
    padding: 0 24px;
  }
</style>
</head>
<body>
  <video id="output" autoplay playsinline muted></video>
  <div id="status">Đang kết nối...</div>
  <script type="module">
    import { createDecartClient, models } from "${DECART_SDK_URL}";

    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");

    let session = null;
    let localStream = null;
    let recorder = null;
    let chunks = [];
    let stopTimer = null;
    let finished = false;
    let recordingStarted = false; // chặn onRemoteStream bắn lại khi WebRTC tự reconnect giữa chừng

    function post(type, payload) {
      finished = finished || type === "done" || type === "error";
      const msg = JSON.stringify({ type, ...payload });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }

    function setStatus(text) {
      statusEl.textContent = text;
      statusEl.style.display = text ? "block" : "none";
    }

    // err có thể là Error (SDK ném trong catch) hoặc 1 event/object trần Decart SDK tự bắn qua
    // session.on("error", ...) - String(plainObject) luôn ra "[object Object]" nên không dùng thẳng.
    function errMsg(e) {
      if (e == null) return "Lỗi không xác định";
      if (typeof e === "string") return e;
      if (e.message) return String(e.message);
      try {
        const json = JSON.stringify(e);
        return json && json !== "{}" ? json : String(e);
      } catch {
        return String(e);
      }
    }

    async function start(config) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        const client = createDecartClient({ apiKey: config.apiKey });

        session = await client.realtime.connect(localStream, {
          model: models.realtime(config.modelId),
          initialState: { prompt: { text: config.prompt }, image: config.garmentImageUrl },
          onRemoteStream: (remoteStream) => {
            outputEl.srcObject = remoteStream;
            setStatus("");
            // Reconnect giữa chừng cũng bắn lại onRemoteStream với stream mới - nếu đã quay rồi
            // thì CHỈ cập nhật khung hình hiển thị, không reset chunks/recorder/đếm ngược.
            if (recordingStarted) return;
            recordingStarted = true;
            startRecording(remoteStream, config);
          },
        });

        session.on("error", (err) => {
          post("error", { code: err?.code ?? "SDK_ERROR", message: errMsg(err) });
          stop();
        });
        session.on("connectionChange", (state) => {
          // Báo RN để đổi chữ trên overlay native (không chỉ status text ẩn bên trong WebView),
          // để lúc demo không trông như app đứng hình khi WebRTC đang tự retry.
          if (state === "connecting") {
            setStatus("Đang kết nối...");
            post("status", { state });
          }
          if (state === "reconnecting") {
            setStatus("Mất kết nối, đang thử lại...");
            post("status", { state });
          }
        });
      } catch (e) {
        post("error", { code: "INIT_FAILED", message: errMsg(e) });
      }
    }

    function startRecording(stream, config) {
      chunks = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => finish(config, mimeType);
      recorder.start();
      post("recording-started", {});
      stopTimer = setTimeout(stop, config.maxDurationSeconds * 1000);
    }

    function stop() {
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else if (!finished) {
        // Chưa kịp nhận remote stream / chưa quay được gì -> không có video để upload
        post("error", { code: "NO_RECORDING", message: "Chưa quay được video nào." });
      }
      if (session) {
        session.disconnect();
        session = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
    }

    async function finish(config, mimeType) {
      if (chunks.length === 0) {
        post("error", { code: "NO_RECORDING", message: "Chưa quay được video nào." });
        return;
      }
      setStatus("Đang lưu video...");
      try {
        const blob = new Blob(chunks, { type: mimeType });
        const form = new FormData();
        form.append("video", blob, "tryon.webm");
        const res = await fetch(
          config.apiBaseUrl + "/tryon/live/sessions/" + config.sessionId + "/video",
          {
            method: "POST",
            headers: { Authorization: "Bearer " + config.accessToken },
            body: form,
          },
        );
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error((json && json.message) || "Tải video lên thất bại.");
        post("done", { videoUrl: json.result.videoUrl });
      } catch (e) {
        post("error", { code: "UPLOAD_FAILED", message: errMsg(e) });
      }
    }

    function handleInit(raw) {
      try {
        const data = JSON.parse(raw);
        if (data.type === "start") start(data);
        if (data.type === "stop") stop();
      } catch (e) {
        // bỏ qua message không phải JSON hợp lệ
      }
    }

    // iOS WKWebView bắn "message" trên window; Android WebView bắn trên document
    window.addEventListener("message", (e) => handleInit(e.data));
    document.addEventListener("message", (e) => handleInit(e.data));
  </script>
</body>
</html>`;
