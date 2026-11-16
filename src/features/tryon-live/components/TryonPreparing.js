import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Màn "Đang chuẩn bị" của thử đồ AI real-time: thay cho màn đen trong lúc BE tạo phiên, WebView tải SDK Decart
// và mở camera + kết nối AI. Nền tối vì phía sau là khung camera; bảng màu riêng cho màn tối này (chưa có trong theme).
const BG = "#07140D";
const ACCENT = "#4ADE80"; // xanh sáng, đủ tương phản trên nền tối (colors.primary quá đậm)
const TRACK = "rgba(255,255,255,0.12)";
const SOFT_TEXT = "rgba(255,255,255,0.72)";

const RING = 224; // đường kính vòng tiến trình
const STROKE = 8;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const PHOTO = 152; // ảnh món ở giữa vòng
const ORBIT = 292; // khung chứa các biểu tượng xoay quanh vòng
const ORBIT_R = 130;
const BUBBLE = 34;
const ORBIT_ICONS = ["shirt-outline", "sparkles", "heart-outline"];

const TIP_INTERVAL_MS = 4200;
const EASE_IN_OUT = Easing.inOut(Easing.quad); // khai báo ngoài component: hàm mới mỗi lần render sẽ làm animation chạy lại từ đầu

// Tiến trình hiển thị chạy theo "trần" của giai đoạn thật đang xong: chưa xong gì → 28%, xong 1 bước → 55%,
// xong cả 2 bước chuẩn bị → 92% (chờ camera + AI lên hình), có hình thật → 100%. Số hiển thị chỉ tiến, không lùi.
const ceilingOf = ({ hasSession, webReady, done }) => {
  if (done) return 100;
  const finished = (hasSession ? 1 : 0) + (webReady ? 1 : 0);
  return [28, 55, 92][finished];
};

function useSmoothProgress(target) {
  const [value, setValue] = useState(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => {
        const t = targetRef.current;
        if (v >= t) return v;
        const finishing = t >= 100;
        const step = Math.max((t - v) * (finishing ? 0.3 : 0.06), finishing ? 1.5 : 0.1);
        return Math.min(v + step, t);
      });
    }, 50);
    return () => clearInterval(id);
  }, []);
  return value;
}

// Vòng lặp mượt vô hạn (0 → 1) cho xoay / nhấp nháy. Dừng khi gỡ màn hình
function useLoop(duration, { easing = Easing.linear, alternate = false } = {}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = alternate
      ? Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration, easing, useNativeDriver: true }),
          ]),
        )
      : Animated.loop(
          Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
        );
    anim.start();
    return () => anim.stop();
  }, [v, duration, easing, alternate]);
  return v;
}

function buildTips(maxSeconds) {
  return [
    { icon: "sunny-outline", text: "Đứng nơi đủ sáng, ánh sáng chiếu vào mặt thay vì phía sau lưng." },
    { icon: "phone-portrait-outline", text: "Cầm điện thoại ngang tầm mặt, hướng camera trước vào người." },
    { icon: "resize-outline", text: "Đứng cách máy khoảng 1 – 1,5 m để thấy rõ phần thân trên." },
    { icon: "shirt-outline", text: "AI thay phần áo bạn đang mặc bằng món đang xem, nên mặc áo trơn, ôm vừa sẽ ra đẹp hơn." },
    { icon: "body-outline", text: "Đứng thẳng, xoay người thật chậm. Chuyển động nhanh có thể làm hình bị giật." },
    { icon: "timer-outline", text: `Mỗi lượt chỉ ${maxSeconds} giây và bắt đầu ngay khi thanh đạt 100%, bạn hãy sẵn sàng nhé.` },
  ];
}

function TipCarousel({ maxSeconds }) {
  const tips = buildTips(maxSeconds);
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % tips.length);
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, TIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [opacity, tips.length]);
  const tip = tips[index];
  return (
    <View style={styles.tipWrap}>
      <Text style={styles.tipLabel}>LƯU Ý ĐỂ THỬ ĐỒ ĐẸP HƠN</Text>
      <Animated.View style={[styles.tipCard, { opacity }]}>
        <View style={styles.tipIcon}>
          <Ionicons name={tip.icon} size={22} color={ACCENT} />
        </View>
        <Text style={styles.tipText}>{tip.text}</Text>
      </Animated.View>
      <View style={styles.dots}>
        {tips.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function StepRow({ label, state }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        {state === "done" ? (
          <Ionicons name="checkmark-circle" size={20} color={ACCENT} />
        ) : state === "active" ? (
          <ActivityIndicator size="small" color={ACCENT} />
        ) : (
          <Ionicons name="ellipse-outline" size={18} color="rgba(255,255,255,0.35)" />
        )}
      </View>
      <Text style={[styles.stepText, state === "done" && styles.stepDone, state === "todo" && styles.stepTodo]}>
        {label}
      </Text>
    </View>
  );
}

// hasSession: BE đã trả phiên · webReady: WebView đã tải xong SDK · done: đã có hình AI, chuẩn bị bắt đầu thử
// statusText: dòng trạng thái từ WebView ("Mất kết nối, đang thử lại…") · productImage: ảnh món đang thử
export function TryonPreparing({
  hasSession,
  webReady,
  done,
  statusText,
  productImage,
  maxSeconds = 10,
}) {
  const progress = useSmoothProgress(ceilingOf({ hasSession, webReady, done }));
  const percent = Math.floor(progress);

  const spin = useLoop(11000); // quỹ đạo xoay chậm
  const pulse = useLoop(1500, { easing: EASE_IN_OUT, alternate: true });
  const drift = useLoop(5200, { easing: EASE_IN_OUT, alternate: true });
  const fade = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // Đạt 100%: hiện "Bắt đầu!" nảy lên, rồi mờ dần để lộ khung hình AI phía sau
  useEffect(() => {
    if (!done) return;
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.timing(fade, { toValue: 0, duration: 450, delay: 450, useNativeDriver: true }).start();
  }, [done, pop, fade]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });
  const photoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const orbDrift = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const orbDriftReverse = drift.interpolate({ inputRange: [0, 1], outputRange: [12, -12] });

  const failedHint = statusText && statusText.startsWith("Mất");
  const stepState = (finished, firstUnfinished) =>
    finished ? "done" : firstUnfinished ? "active" : "todo";
  const s1 = hasSession;
  const s2 = webReady;
  const s3 = done;
  const active = !s1 ? 1 : !s2 ? 2 : !s3 ? 3 : 0;

  return (
    <Animated.View style={[styles.root, { opacity: fade }]} pointerEvents={done ? "none" : "auto"}>
      {/* Hai quầng sáng mờ trôi chậm làm nền */}
      <Animated.View style={[styles.orb, styles.orbTop, { transform: [{ translateY: orbDrift }] }]} />
      <Animated.View style={[styles.orb, styles.orbBottom, { transform: [{ translateY: orbDriftReverse }] }]} />

      <View style={styles.top}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={12} color={colors.secondary} />
          <Text style={styles.badgeText}>THỬ ĐỒ AI REAL-TIME</Text>
        </View>
        <Text style={styles.title}>{done ? "Bắt đầu thử đồ!" : "Đang chuẩn bị buồng thử đồ"}</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.orbit}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
            {ORBIT_ICONS.map((name, i) => {
              const angle = (i * 2 * Math.PI) / ORBIT_ICONS.length - Math.PI / 2;
              return (
                <View
                  key={name}
                  style={[
                    styles.bubble,
                    {
                      left: ORBIT / 2 + ORBIT_R * Math.cos(angle) - BUBBLE / 2,
                      top: ORBIT / 2 + ORBIT_R * Math.sin(angle) - BUBBLE / 2,
                    },
                  ]}
                >
                  <Animated.View style={{ transform: [{ rotate: counter }] }}>
                    <Ionicons name={name} size={18} color={i === 1 ? colors.secondary : ACCENT} />
                  </Animated.View>
                </View>
              );
            })}
          </Animated.View>

          <View style={styles.ring}>
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
              <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={TRACK} strokeWidth={STROKE} fill="none" />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                stroke={done ? colors.secondary : ACCENT}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress / 100)}
                fill="none"
                rotation={-90}
                origin={`${RING / 2}, ${RING / 2}`}
              />
            </Svg>
            <Animated.View style={[styles.photo, { transform: [{ scale: photoScale }] }]}>
              {productImage ? (
                <Image source={{ uri: productImage }} style={styles.photoImg} resizeMode="cover" />
              ) : (
                <Ionicons name="shirt-outline" size={64} color={ACCENT} />
              )}
              <View style={styles.photoShade} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.percentRow}>
          {done ? (
            <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
              <Text style={styles.percent}>100%</Text>
            </Animated.View>
          ) : (
            <Text style={styles.percent}>{percent}%</Text>
          )}
        </View>
        <Text style={[styles.status, failedHint && styles.statusWarn]}>
          {done ? "Sẵn sàng, xoay người nhẹ nhàng nhé" : statusText || "Vui lòng giữ nguyên màn hình"}
        </Text>
      </View>

      <View style={styles.steps}>
        <StepRow label="Tạo phiên thử đồ" state={stepState(s1, active === 1)} />
        <StepRow label="Tải mô hình AI" state={stepState(s2, active === 2)} />
        <StepRow label="Mở camera và kết nối AI" state={stepState(s3, active === 3)} />
      </View>

      <TipCarousel maxSeconds={maxSeconds} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    justifyContent: "space-between",
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  orb: { position: "absolute", borderRadius: radius.pill, backgroundColor: ACCENT, opacity: 0.1 },
  orbTop: { width: 280, height: 280, top: -90, right: -90 },
  orbBottom: { width: 240, height: 240, bottom: 120, left: -110, opacity: 0.07 },
  top: { alignItems: "center", gap: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { ...textStyles.label, fontFamily: fonts.semibold, color: colors.secondary, letterSpacing: 1 },
  title: { ...textStyles.title, color: colors.onPrimary, textAlign: "center" },
  stage: { alignItems: "center" },
  orbit: { width: ORBIT, height: ORBIT, alignItems: "center", justifyContent: "center" },
  bubble: {
    position: "absolute",
    width: BUBBLE,
    height: BUBBLE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  photoImg: { width: "100%", height: "100%" },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,20,13,0.18)" },
  percentRow: { marginTop: -spacing.md, minHeight: 52, justifyContent: "center" },
  percent: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 48, color: colors.onPrimary },
  status: { ...textStyles.body, color: SOFT_TEXT, textAlign: "center", marginTop: spacing.xs },
  statusWarn: { color: colors.secondary },
  steps: { gap: spacing.sm, alignSelf: "center", minWidth: 230 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepIcon: { width: 22, alignItems: "center" },
  stepText: { ...textStyles.body, color: colors.onPrimary },
  stepDone: { color: SOFT_TEXT },
  stepTodo: { color: "rgba(255,255,255,0.4)" },
  tipWrap: { gap: spacing.sm },
  tipLabel: { ...textStyles.label, fontFamily: fonts.semibold, color: SOFT_TEXT, letterSpacing: 1, textAlign: "center" },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 84,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  tipIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(74,222,128,0.14)",
  },
  tipText: { ...textStyles.body, flex: 1, color: colors.onPrimary },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { width: 18, backgroundColor: ACCENT },
});
