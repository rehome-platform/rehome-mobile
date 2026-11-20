import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

const STUB_W = 88;
const NOTCH = 16; // đường kính lỗ khuyết
const DOTS = 7; // số chấm của đường xé

// Khung voucher dạng VÉ (kiểu Shopee/Lazada, màu ReHome): cuống trái xanh đậm chữ trắng ("20K" + loại mã),
// 2 lỗ khuyết nửa tròn trên/dưới + đường chấm xé, thân phải là children.
// headline: chữ lớn ở cuống (không có → icon thẻ giá) · kind: chữ nhỏ dưới (PHÍ SHIP / GIẢM GIÁ)
// muted: đã dùng / hết hạn / chưa đủ điều kiện → cuống xám · stamp: nhãn góc phải ("Đã dùng", "Hết hạn")
// selected: viền xanh dày (bảng chọn mã) · notchColor: màu nền phía sau thẻ để lỗ khuyết trông như bị đục thủng
export function VoucherTicket({
  headline,
  kind,
  muted = false,
  selected = false,
  stamp,
  notchColor = colors.background,
  children,
  style,
}) {
  const borderColor = selected ? colors.primary : colors.neutral;
  return (
    <View
      style={[
        styles.card,
        { borderColor },
        selected && styles.cardSelected,
        style,
      ]}
    >
      <View style={[styles.stub, muted && styles.stubMuted]}>
        {headline ? (
          <Text
            style={styles.headline}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {headline}
          </Text>
        ) : (
          <Ionicons name="pricetag" size={24} color={colors.onPrimary} />
        )}
        {kind ? <Text style={styles.kind}>{kind}</Text> : null}
        {/* Đường xé: cột chấm trắng sát mép phải cuống */}
        <View style={styles.perforation} pointerEvents="none">
          {Array.from({ length: DOTS }, (_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      {stamp ? (
        <View style={styles.stamp} pointerEvents="none">
          <Text style={styles.stampText}>{stamp}</Text>
        </View>
      ) : null}

      {/* Lỗ khuyết: hình tròn cùng màu nền phía sau, nằm đè lên mép trên/dưới — thẻ cắt mất nửa → thành nửa tròn */}
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchTop,
          { backgroundColor: notchColor, borderColor },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchBottom,
          { backgroundColor: notchColor, borderColor },
        ]}
      />
    </View>
  );
}

// Ô mã voucher viền nét đứt (dùng trong thân thẻ)
export function VoucherCode({ code, muted = false }) {
  return (
    <View style={[styles.code, muted && styles.codeMuted]}>
      <Text
        style={[styles.codeText, muted && styles.codeTextMuted]}
        numberOfLines={1}
      >
        {code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderWidth: 2 },
  stub: {
    width: STUB_W,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm + 4,
    backgroundColor: colors.primary,
  },
  stubMuted: { backgroundColor: colors.disabled },
  headline: {
    ...textStyles.title,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  kind: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  perforation: {
    position: "absolute",
    right: 3,
    top: NOTCH / 2 + 4,
    bottom: NOTCH / 2 + 4,
    justifyContent: "space-between",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  body: { flex: 1, gap: 4, padding: spacing.md },
  notch: {
    position: "absolute",
    left: STUB_W - NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    borderWidth: 1,
  },
  notchTop: { top: -NOTCH / 2 },
  notchBottom: { bottom: -NOTCH / 2 },
  stamp: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    transform: [{ rotate: "-8deg" }],
  },
  stampText: {
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  code: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: 6,
    backgroundColor: colors.highlight,
  },
  codeMuted: { borderColor: colors.disabled, backgroundColor: colors.background },
  codeText: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  codeTextMuted: { color: colors.textSecondary },
});
