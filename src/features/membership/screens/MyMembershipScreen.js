import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ListGroup, ListItem } from "@/components/ui/ListItem";
import { useAuthStore } from "@/stores/authStore";
import { BILLING_CYCLE_LABEL } from "@/constants/membership";
import { useMyMembership, usePlans } from "../hooks/useMembership";
import {
  hasPaidPlan,
  isExpiringSoon,
  tryonLimitLine,
} from "../utils/membershipRules";
import { QuotaRow } from "../components/QuotaRow";
import { TierBadge } from "../components/TierBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// M-03 · Gói của tôi (/membership/me). Không có tự gia hạn, không có nút huỷ gói (bản chốt 14/11)
export default function MyMembershipScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useMyMembership();
  const plans = usePlans();

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Gói của tôi" onBack={goBack} />;
  if (query.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={query.error.message}>
          <Button title="Thử lại" variant="secondary" onPress={() => query.refetch()} />
        </ErrorBox>
      </Screen>
    );
  }

  const me = query.data;
  const paid = hasPaidPlan(me);
  const soon = isExpiringSoon(me);
  const q = me.quota ?? {};
  const live = tryonLimitLine(q.liveTryon, "Thử đồ real-time");
  const ai = tryonLimitLine(q.aiTryon, "Phối đồ AI");
  const forms = q.consignmentForms;
  const featured = q.featuredListing;
  const vs = me.voucherSummary ?? { unused: 0, expiringSoon: 0 };
  // Gia hạn = mua lại đúng gói đang dùng, cùng chu kỳ
  const currentPlan = plans.data?.find((p) => p.tier === me.tier);

  const renew = () =>
    currentPlan
      ? router.push(
          `/membership/subscribe?planId=${currentPlan.id}&cycle=${me.billingCycle ?? "MONTHLY"}`,
        )
      : router.push("/membership");

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        paid ? (
          <View style={styles.footerRow}>
            <Button
              title={soon ? "Gia hạn ngay" : "Gia hạn"}
              onPress={renew}
              style={styles.flex}
            />
            <Button
              title="Đổi gói"
              variant="secondary"
              onPress={() => router.push("/membership")}
              style={styles.flex}
            />
          </View>
        ) : (
          <Button title="Xem các gói thành viên" onPress={() => router.push("/membership")} />
        )
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }
      >
        {/* Thẻ hạng */}
        <View
          style={[
            styles.hero,
            paid && styles.heroPaid,
            soon && styles.heroWarn,
          ]}
        >
          <View style={styles.heroHead}>
            <TierBadge tier={me.tier} inverse={paid && !soon} />
            {paid && me.billingCycle ? (
              <Text style={[styles.heroCaption, paid && !soon && styles.onPrimary]}>
                {BILLING_CYCLE_LABEL[me.billingCycle]}
              </Text>
            ) : null}
          </View>
          {paid ? (
            <>
              <Text style={[styles.heroTitle, !soon && styles.onPrimary]}>
                {soon ? `⚠ Còn ${me.daysRemaining} ngày là hết hạn` : `${me.tierName} · còn ${me.daysRemaining} ngày`}
              </Text>
              <Text style={[styles.heroCaption, !soon && styles.onPrimary]}>
                Hết hạn {dayjs(me.expiresAt).format("DD/MM/YYYY")}.{" "}
                {soon
                  ? "Gia hạn ngay để không bị về Thành viên thường."
                  : "Gói không tự gia hạn."}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>Chưa đăng ký gói trả phí</Text>
              <Text style={styles.heroCaption}>
                Hạn mức cơ bản, chưa có voucher hằng tháng hay sản phẩm nổi bật.
              </Text>
            </>
          )}
        </View>

        {/* Hạn mức */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hạn mức của bạn</Text>
          {live ? <QuotaRow {...live} /> : null}
          {ai ? <QuotaRow {...ai} /> : null}
          {forms ? (
            <QuotaRow
              label="Form ký gửi đang chờ duyệt"
              used={forms.pending}
              limit={forms.limit}
            />
          ) : null}
          <QuotaRow
            label="Sản phẩm nổi bật"
            value={
              featured?.enabled
                ? `Đang nổi bật ${featured.productCount} món`
                : "Không có trong gói"
            }
            muted={!featured?.enabled}
            note={
              featured?.enabled
                ? "Áp dụng cho hàng đang bán trên sàn, tự bật theo hạn gói"
                : null
            }
          />
        </View>

        <ListGroup>
          <ListItem
            icon="pricetags-outline"
            title="Voucher của tôi"
            description={
              paid || vs.unused
                ? `${vs.unused} mã chưa dùng${vs.expiringSoon ? ` · ${vs.expiringSoon} sắp hết hạn` : ""}`
                : "Gói Bạc trở lên được nhận voucher mỗi tháng"
            }
            badge={vs.expiringSoon ? "Sắp hết hạn" : undefined}
            onPress={() => router.push("/vouchers")}
          />
          <ListItem
            icon="time-outline"
            title="Lịch sử mua gói"
            onPress={() => router.push("/membership/history")}
          />
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg, padding: spacing.lg },
  flex: { flex: 1 },
  footerRow: { flexDirection: "row", gap: spacing.sm },
  hero: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.neutral,
  },
  heroPaid: { backgroundColor: colors.primary },
  heroWarn: {
    backgroundColor: tones.warning.bg,
    borderWidth: 1,
    borderColor: tones.warning.fg,
  },
  heroHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { ...textStyles.title, color: colors.text, marginTop: spacing.xs },
  heroCaption: { ...textStyles.caption, color: colors.textSecondary },
  onPrimary: { color: colors.onPrimary },
  card: {
    padding: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...textStyles.label,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
});
