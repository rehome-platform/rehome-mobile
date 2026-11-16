// Trang chạy BÊN TRONG react-native-webview, không qua Metro bundler → load Decart Web SDK
// qua jsdelivr "+esm" (CDN serve lại gói npm @decartai/sdk dưới dạng ES module cho browser).
// SDK có entry React Native riêng nhưng cần LiveKit native (phải build lại APK) và không có
// MediaRecorder để quay lại video → vẫn dùng WebView. Không có secret nào nằm sẵn trong HTML
// này: apiKey là CLIENT TOKEN ngắn hạn, RN chỉ truyền vào qua postMessage (TryonLiveWebview.js).
//
// Luồng: tải SDK xong -> báo RN "ready" -> RN gửi "start" ĐÚNG 1 LẦN -> getUserMedia ->
// client.realtime.connect(...) -> nhận remote stream đã "mặc đồ" -> có khung hình đầu tiên thì
// mới bắt đầu MediaRecorder + báo "recording-started". Hết maxDurationSeconds (hoặc RN gửi
// "stop", hoặc Decart cắt phiên / rớt mạng giữa chừng) -> dừng recorder + disconnect -> báo
// "saving" -> upload thẳng tới BE (multipart, kèm bearer token) -> báo "done" kèm videoUrl.
//
// Message gửi về RN: ready | status {state} | recording-started | saving | done {videoUrl} |
// error {code, message} | log {…} (chỉ để debug). "done"/"error" chỉ gửi tối đa 1 lần.
const DECART_SDK_URL = "https://cdn.jsdelivr.net/npm/@decartai/sdk@0.2.14/+esm";

export const TRYON_LIVE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  #output { width: 100%; height: 100%; object-fit: cover; background: #000; }
</style>
</head>
<body>
  <video id="output" autoplay playsinline muted></video>
  <script type="module">
    const SDK_URL = "${DECART_SDK_URL}";
    const UPLOAD_TIMEOUT_MS = 60000;
    // Clip 10 giây ~3MB, dưới giới hạn 8MB của BE (tryon.live.max-video-size-bytes)
    const RECORD_BITS_PER_SECOND = 2500000;

    const outputEl = document.getElementById("output");

    let sdk = null;
    let session = null;
    let localStream = null;
    let recorder = null;
    let chunks = [];
    let stopTimer = null;
    let started = false; // start() chỉ chạy 1 lần dù RN lỡ gửi "start" nhiều lần
    let stopped = false; // đã yêu cầu dừng (hết giờ / RN bấm Đóng / phiên bị cắt)
    let recordingStarted = false;
    let finishing = false; // finish() chỉ chạy 1 lần
    let reported = false; // đã gửi "done" hoặc "error" cho RN

    function post(type, payload) {
      const msg = JSON.stringify({ type, ...payload });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }

    function fail(code, message) {
      if (reported) return;
      reported = true;
      post("error", { code, message });
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

    function release() {
      if (session) {
        try {
          session.disconnect();
        } catch {
          // đã ngắt rồi
        }
        session = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
    }

    async function start(config) {
      if (started) return;
      started = true;
      try {
        const model = sdk.models.realtime(config.modelId);
        // Xin camera đúng cỡ + fps model cần (lucy-vton: 1280x720, 30fps). Không truyền thì
        // WebView Android trả cỡ mặc định thấp (thường 640x480) -> hình mờ, Decart phải phóng lên.
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: model.width },
            height: { ideal: model.height },
            frameRate: model.fps,
          },
          audio: false,
        });
        if (stopped) {
          release();
          return;
        }
        const camera = localStream.getVideoTracks()[0];
        post("log", { camera: camera ? camera.getSettings() : null });

        const client = sdk.createDecartClient({ apiKey: config.apiKey });
        const connected = await client.realtime.connect(localStream, {
          model,
          initialState: { prompt: { text: config.prompt }, image: config.garmentImageUrl },
          onRemoteStream: (remoteStream) => showRemoteStream(remoteStream, config),
          onConnectionChange,
        });
        session = connected;
        if (stopped) {
          // RN bấm Đóng / hết giờ trong lúc connect() còn đang chờ
          release();
          return;
        }
        session.on("error", onSessionError);
        // Decart chủ động kết thúc phiên (vi phạm chính sách, hết credit, quá số phiên...)
        session.on("sessionEnded", (e) => {
          post("log", { sessionEnded: e });
          if (!recordingStarted) fail("SESSION_ENDED", "Phiên thử đồ AI đã bị kết thúc.");
          stop();
        });
      } catch (e) {
        if (recordingStarted) {
          stop(); // đã có hình -> lưu phần đã quay
        } else {
          fail(e && e.code ? e.code : "INIT_FAILED", errMsg(e));
          stopped = true;
          release();
        }
      }
    }

    function onConnectionChange(state) {
      if (stopped) return;
      if (recordingStarted) {
        // Đang quay mà rớt kết nối, hoặc Decart cắt phiên vì hết maxSessionDuration: SDK sẽ tự
        // reconnect = mở PHIÊN MỚI (tính tiền thêm, vượt lượt đã trừ quota) -> dừng luôn và
        // lưu phần đã quay được.
        if (state === "reconnecting" || state === "disconnected") stop();
        return;
      }
      if (state === "connecting" || state === "reconnecting") post("status", { state });
    }

    function onSessionError(err) {
      if (recordingStarted) {
        stop(); // đã có hình -> ưu tiên lưu phần đã quay thay vì báo lỗi
        return;
      }
      fail(err && err.code ? err.code : "SDK_ERROR", errMsg(err));
      stop();
    }

    function showRemoteStream(remoteStream, config) {
      if (stopped) return;
      // SDK bắn lại onRemoteStream mỗi khi có thêm track -> chỉ gán khi thật sự là stream khác,
      // gán lại cùng nguồn làm <video> nháy đen.
      if (outputEl.srcObject !== remoteStream) outputEl.srcObject = remoteStream;
      outputEl.play().catch(() => {});
      if (recordingStarted) return;

      // Chỉ bắt đầu quay + đếm ngược khi ĐÃ có khung hình thật, không phải lúc mới nhận track
      // (còn đen vài giây trong lúc model khởi động) -> video lưu lại không có đoạn đen đầu.
      const begin = () => {
        if (recordingStarted || stopped) return;
        recordingStarted = true;
        startRecording(outputEl.srcObject, config);
      };
      if (outputEl.requestVideoFrameCallback) outputEl.requestVideoFrameCallback(begin);
      outputEl.addEventListener("playing", begin, { once: true });
    }

    function startRecording(stream, config) {
      chunks = [];
      // VP8 nhẹ CPU hơn VP9 khi mã hoá bằng phần mềm trên điện thoại (WebRTC đang chạy cùng lúc)
      // iOS (WKWebView) không ghi được WebM, chỉ MP4 -> để MP4 cuối danh sách cho iPhone
      const mimeType = ["video/webm;codecs=vp8", "video/webm", "video/mp4"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      try {
        recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: RECORD_BITS_PER_SECOND,
        });
      } catch (e) {
        fail("RECORDER_FAILED", errMsg(e));
        stop();
        return;
      }
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      // onstop cũng tự bắn khi track kết thúc (Decart cắt phiên) chứ không chỉ khi gọi stop()
      recorder.onstop = () => {
        stop();
        finish(config);
      };
      recorder.onerror = () => stop();
      recorder.start(1000);
      post("recording-started", {});
      stopTimer = setTimeout(stop, config.maxDurationSeconds * 1000);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop(); // -> onstop -> finish()
      } else if (!recordingStarted) {
        // Chưa kịp nhận hình / chưa quay được gì -> không có video để upload
        fail("NO_RECORDING", "Chưa quay được video nào.");
      }
      release();
    }

    async function finish(config) {
      if (finishing) return;
      finishing = true;
      if (chunks.length === 0) {
        fail("NO_RECORDING", "Chưa quay được video nào.");
        return;
      }
      post("saving", {});
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
      try {
        // Lấy định dạng recorder THẬT SỰ ghi (Android: webm, iPhone: mp4), bỏ phần ;codecs=...
        // BE nhận video/webm hoặc video/mp4 và kiểm tra magic bytes -> nhãn phải khớp nội dung.
        const recorded = (recorder && recorder.mimeType) || "video/webm";
        const type = recorded.split(";")[0].trim().toLowerCase() === "video/mp4"
          ? "video/mp4"
          : "video/webm";
        const blob = new Blob(chunks, { type });
        const form = new FormData();
        form.append("video", blob, type === "video/mp4" ? "tryon.mp4" : "tryon.webm");
        const res = await fetch(
          config.apiBaseUrl + "/tryon/live/sessions/" + config.sessionId + "/video",
          {
            method: "POST",
            headers: { Authorization: "Bearer " + config.accessToken },
            body: form,
            signal: controller.signal,
          },
        );
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error((json && json.message) || "Tải video lên thất bại.");
        const videoUrl = json && json.result && json.result.videoUrl;
        if (!videoUrl) throw new Error("Máy chủ không trả về đường dẫn video.");
        reported = true;
        post("done", { videoUrl });
      } catch (e) {
        const aborted = e && e.name === "AbortError";
        fail("UPLOAD_FAILED", aborted ? "Tải video lên quá lâu, vui lòng thử lại." : errMsg(e));
      } finally {
        clearTimeout(timeout);
      }
    }

    function handleMessage(raw) {
      try {
        const data = JSON.parse(raw);
        if (data.type === "start") start(data);
        if (data.type === "stop") stop();
      } catch (e) {
        // bỏ qua message không phải JSON hợp lệ
      }
    }

    // SDK tải qua mạng (jsdelivr) nên phải chờ xong mới nhận "start" - báo "ready" để RN biết,
    // không đoán bằng setTimeout. Lỗi tải (mất mạng, CDN bị chặn) báo thẳng thay vì treo.
    import(SDK_URL)
      .then((mod) => {
        sdk = mod;
        // iOS WKWebView bắn "message" trên window; Android WebView bắn trên document
        window.addEventListener("message", (e) => handleMessage(e.data));
        document.addEventListener("message", (e) => handleMessage(e.data));
        post("ready", {});
      })
      .catch(() => {
        fail(
          "SDK_LOAD_FAILED",
          "Không tải được thư viện thử đồ AI. Kiểm tra kết nối mạng rồi thử lại.",
        );
      });
  </script>
</body>
</html>`;
