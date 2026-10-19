import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { ORDER_STEPS } from "@/constants/order";

// Thanh 5 bước ngang (BR-11). step = chỉ số bước ĐÃ xong (orderStepOf); bước kế = đang diễn ra
export function OrderStepper({ step }) {
  return (
    <View style={styles.row}>
      {ORDER_STEPS.map((label, i) => {
        const done = i <= step;
        const current = i === step + 1;
        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                current && styles.dotCurrent,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                (done || current) && styles.labelOn,
                current && styles.labelCurrent,
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingVertical: spacing.md },
  step: { flex: 1, alignItems: "center", gap: spacing.xs },
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
  dotDone: { backgroundColor: colors.text, borderColor: colors.text },
  dotCurrent: { borderColor: colors.text },
  label: {
    ...textStyles.caption,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
  labelOn: { color: colors.text },
  labelCurrent: { fontFamily: fonts.semibold },
});
