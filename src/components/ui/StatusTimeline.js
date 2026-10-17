import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

// Dòng thời gian dọc. state: "done" (✓ nền xanh) | "active" (vòng xanh đậm) | "todo" (vòng xám)
export function StatusTimeline({ steps }) {
  return (
    <View style={styles.card}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <View key={step.title} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.dot, styles[step.state]]}>
                {step.state === "done" ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.onPrimary}
                  />
                ) : null}
              </View>
              {!last ? (
                <View
                  style={[
                    styles.line,
                    step.state === "done" && styles.lineDone,
                  ]}
                />
              ) : null}
            </View>
            <View style={[styles.body, !last && styles.bodyGap]}>
              <Text
                style={[styles.title, step.state === "todo" && styles.muted]}
              >
                {step.title}
              </Text>
              {step.desc ? <Text style={styles.desc}>{step.desc}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  item: { flexDirection: "row", gap: spacing.md },
  rail: { alignItems: "center" },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral,
    backgroundColor: colors.surface,
  },
  done: { backgroundColor: colors.primary, borderColor: colors.primary },
  active: { borderColor: colors.primary, borderWidth: 7 }, // viền dày → thành chấm tròn có vòng
  todo: {},
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: colors.neutral,
  },
  lineDone: { backgroundColor: colors.primary },
  body: { flex: 1, paddingTop: 2 },
  bodyGap: { paddingBottom: spacing.lg },
  title: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  muted: { color: colors.textSecondary },
  desc: { ...textStyles.caption, color: colors.textSecondary },
});
