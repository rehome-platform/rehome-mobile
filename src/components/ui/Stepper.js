import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";

// Thanh tiến trình nhiều bước. current: chỉ số bước đang làm (0 = bước 1)
export function Stepper({ steps, current }) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={`Bước ${current + 1} trên ${steps.length}: ${steps[current]}`}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={label}>
            {i > 0 ? (
              <View style={[styles.line, i <= current && styles.lineDone]} />
            ) : null}
            <View style={styles.step}>
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                {done ? (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.onPrimary}
                  />
                ) : (
                  <Text style={[styles.number, active && styles.numberActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.label, (done || active) && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const SIZE = 28;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  step: { alignItems: "center", gap: spacing.xs, width: 64 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral,
    backgroundColor: colors.surface,
  },
  circleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleActive: { borderColor: colors.primary },
  number: { ...textStyles.label, color: colors.textSecondary },
  numberActive: { fontFamily: fonts.bold, color: colors.primary },
  line: {
    flex: 1,
    height: 2,
    marginTop: SIZE / 2 - 1,
    backgroundColor: colors.neutral,
  },
  lineDone: { backgroundColor: colors.primary },
  label: { ...textStyles.caption, color: colors.textSecondary },
  labelActive: { fontFamily: fonts.semibold, color: colors.text },
});
