import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { TRACKING_EVENT_LABEL } from "@/constants/order";
import { useOrder, useTracking } from "../hooks/useOrders";
import { toDate } from "../utils/time";
import { formatEventTime, ghnTrackingUrl } from "../utils/orderRules";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/orders");
// Ưu tiên câu mô tả BE / GHN gửi (chi tiết hơn, vd "lần 2"); không có mới dùng bảng chữ của app
const eventLabel = (e) =>
  e.label ?? e.description ?? TRACKING_EVENT_LABEL[e.status] ?? e.status;

// BR-12 · Theo dõi vận chuyển (bình thường / có sự cố). Mốc mới nhất ở trên
export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const order = useOrder(id);
  const tracking = useTracking(id);

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Theo dõi vận chuyển" onBack={goBack} />;
  if (tracking.isPending || order.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (tracking.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={tracking.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => tracking.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const t = tracking.data;
  const events = t.events ?? [];
  const code = t.ghnTrackingCode;
  const latest = events[0];

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    showToast("Đã sao chép mã vận đơn");
  };

  const footer = (
    <View style={styles.footerRow}>
      <Button
        title="Xem chi tiết đơn"
        variant="secondary"
        onPress={() => router.replace(`/orders/${id}`)}
        style={styles.flex}
      />
      {code ? (
        <Button
          title="Xem trên GHN"
          onPress={() => Linking.openURL(ghnTrackingUrl(code))}
          style={styles.flex}
        />
      ) : null}
    </View>
  );

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Text style={styles.orderNo}>Đơn {order.data?.orderNo}</Text>
          {code ? (
            <Pressable
              onPress={copyCode}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sao chép mã vận đơn"
            >
              <Text style={styles.code}>GHN · {code}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.muted}>
          {t.hasIssue && latest
            ? `Chưa có cập nhật mới từ ${toDate(latest.timestamp).format("DD/MM")}`
            : t.expectedDeliveryDate
              ? `Dự kiến giao ${toDate(t.expectedDeliveryDate).format("DD/MM/YYYY")}`
              : ""}
        </Text>
      </View>

      {t.hasIssue ? (
        <View style={styles.issue}>
          <Text style={styles.issueTitle}>Đơn này đang có vấn đề</Text>
          <Text style={styles.text}>
            {t.issueNote ??
              "GHN chưa giao được hàng. Nếu không giao được, kiện hàng trả về địa điểm ký gửi và tiền hoàn vào ví bạn."}
          </Text>
        </View>
      ) : null}

      {events.length ? (
        <View>
          {events.map((e, i) => {
            const last = i === events.length - 1;
            return (
              <View key={`${e.timestamp}-${i}`} style={styles.event}>
                <View style={styles.rail}>
                  <View style={[styles.dot, i === 0 && styles.dotNow]} />
                  {!last ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.eventBody}>
                  <View style={styles.eventHead}>
                    <Text style={[styles.eventTitle, i === 0 && styles.strong]}>
                      {eventLabel(e)}
                    </Text>
                    <Text style={styles.muted}>
                      {formatEventTime(e.timestamp)}
                    </Text>
                  </View>
                  {e.location ? (
                    <Text style={styles.muted}>{e.location}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.muted}>Chưa có cập nhật từ GHN.</Text>
      )}

      <NoteBox>
        Mốc thời gian lấy từ GHN gửi về, không phải ReHome tự gõ. Nếu GHN chưa cập
        nhật thì màn này cũng chưa đổi.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  footerRow: { flexDirection: "row", gap: spacing.md },
  top: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderNo: { ...textStyles.heading, color: colors.text },
  code: {
    ...textStyles.body,
    color: colors.accent,
    textDecorationLine: "underline",
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  strong: { fontFamily: fonts.semibold },
  issue: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: radius.input,
  },
  issueTitle: { ...textStyles.heading, color: colors.text },
  event: { flexDirection: "row", gap: spacing.md },
  rail: { width: 16, alignItems: "center" },
  dot: {
    width: 14,
    height: 14,
    marginTop: 3,
    borderRadius: 7,
    backgroundColor: colors.text,
  },
  dotNow: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.neutral,
    marginVertical: 2,
  },
  eventBody: { flex: 1, gap: 2, paddingBottom: spacing.lg },
  eventHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  eventTitle: { flex: 1, ...textStyles.body, color: colors.text },
});
