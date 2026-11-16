import { StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { productTiming } from "@/utils/consignment";

// "Kỳ x / 3" + thanh chia 3 khúc (mỗi khúc 1 kỳ) + "Ngày n / 90" + hạn của kỳ hiện tại
export function TermProgress({ product }) {
  const t = productTiming(product);
  const percent = Math.min(100, (t.dayNumber / t.totalDays) * 100);
  const left =
    t.termDaysLeft > 0 ? `còn ${t.termDaysLeft} ngày` : "hết hôm nay";
  const deadline = dayjs(product.endOfTermDeadline).format("DD/MM/YYYY");

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>KỲ KÝ GỬI</Text>
        <Text style={styles.term}>
          Kỳ {product.currentTerm} / {t.totalTerms}
          {t.isLastTerm ? " — kỳ cuối" : ""}
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        {/* vạch chia giữa các kỳ */}
        {Array.from({ length: t.totalTerms - 1 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              { left: `${((i + 1) / t.totalTerms) * 100}%` },
            ]}
          />
        ))}
      </View>
      <View style={styles.head}>
        <Text style={styles.caption}>
          Ngày {t.dayNumber} / {t.totalDays}
        </Text>
        <Text
          style={[
            styles.caption,
            t.isLastTerm && t.termDaysLeft <= 7 && styles.urgent,
          ]}
        >
          {t.isLastTerm ? "Hết hạn" : `Hết kỳ ${product.currentTerm}`}:{" "}
          {deadline} · {left}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  term: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.primary },
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.surface,
  },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  urgent: { fontFamily: fonts.semibold, color: colors.error },
});
