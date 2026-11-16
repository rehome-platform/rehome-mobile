import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { useMyMembership } from "../hooks/useMembership";

// Dải gợi ý ở tab Ký gửi, theo gói thành viên (số liệu từ GET /memberships/me):
// - kind "selling": gói có nổi bật → "Gói X đang giúp N món hiển thị ưu tiên đến dd/MM";
//                   chưa có mà đang có món trên sàn → gợi ý nâng cấp (đúng lúc món vừa lên sàn — bản chốt)
// - kind "pending": "Đang có x/y yêu cầu chờ duyệt"; đủ mức → gợi ý nâng cấp để gửi nhiều hơn
export function ConsignMembershipHint({ kind, sellingCount = 0, pendingCount = 0 }) {
  const query = useMyMembership();
  const me = query.data;
  if (!me) return null;
  const q = me.quota ?? {};

  if (kind === "selling") {
    const f = q.featuredListing;
    if (f?.enabled)
      return (
        <View style={[styles.box, styles.ok]}>
          <Ionicons name="star" size={16} color={tones.warning.fg} />
          <Text style={styles.text}>
            {me.tierName} đang giúp{" "}
            <Text style={styles.bold}>{f.productCount} món</Text> của bạn hiển
            thị ưu tiên trên sàn
            {me.expiresAt ? ` đến ${dayjs(me.expiresAt).format("DD/MM/YYYY")}` : ""}.
          </Text>
        </View>
      );
    if (sellingCount === 0) return null;
    return (
      <Upsell text="Nâng cấp gói thành viên để toàn bộ hàng đang bán của bạn được xếp lên trên và gắn nhãn Nổi bật." />
    );
  }

  // kind === "pending"
  const forms = q.consignmentForms;
  if (!forms || pendingCount === 0) return null;
  const full = forms.pending >= forms.limit;
  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>
        Đang có <Text style={styles.bold}>{forms.pending}/{forms.limit}</Text>{" "}
        yêu cầu chờ duyệt.{" "}
        {full
          ? "Đã đủ mức, chờ duyệt bớt rồi gửi thêm."
          : `Gửi thêm được ${forms.remaining} yêu cầu.`}
      </Text>
      {full ? (
        <Upsell text="Nâng cấp gói để gửi nhiều yêu cầu chờ duyệt cùng lúc hơn." />
      ) : null}
    </View>
  );
}

function Upsell({ text }) {
  return (
    <Pressable
      onPress={() => router.push("/membership")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.box, styles.upsell, pressed && styles.pressed]}
    >
      <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
  },
  ok: { backgroundColor: tones.warning.bg },
  upsell: { backgroundColor: colors.highlight },
  pressed: { opacity: 0.85 },
  text: { flex: 1, ...textStyles.caption, color: colors.text },
  info: { ...textStyles.caption, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
});
