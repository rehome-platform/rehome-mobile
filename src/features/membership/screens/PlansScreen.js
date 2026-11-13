import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { formatVnd } from "@/utils/money";
import { BILLING_CYCLE } from "@/constants/membership";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useMyMembership, usePlans } from "../hooks/useMembership";
import {
  hasPaidPlan,
  isExpiringSoon,
  maxYearlySaving,
  planAction,
} from "../utils/membershipRules";
import { PlanCard } from "../components/PlanCard";
import { SegmentTabs } from "../components/SegmentTabs";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// Câu hỏi thường gặp — chỉ là luật đã chốt (14/11), không chứa con số Admin đổi được
const FAQ = [
  [
    "Gói có tự gia hạn không?",
    "Không. Gói dừng khi hết hạn; ReHome nhắc bạn trước 3 ngày để gia hạn nếu muốn.",
  ],
  [
    "Đổi sang gói khác giữa chừng thì sao?",
    "Gói đang dùng dừng ngay khi gói mới có hiệu lực và không được hoàn phần còn lại. Gia hạn cùng gói thì thời gian được cộng dồn.",
  ],
  [
    "Voucher dùng thế nào?",
    "Mã được phát mỗi tháng khi gói còn hiệu lực, dùng được 30 ngày kể từ ngày nhận, mỗi lần thanh toán dùng 1 mã. Phần giảm do ReHome chịu, người ký gửi vẫn nhận đủ tiền.",
  ],
  [
    "Sản phẩm nổi bật là gì?",
    "Toàn bộ hàng đang bán trên sàn của bạn được xếp lên trên và gắn nhãn \"Nổi bật\", tự bật khi gói có hiệu lực. Nhãn không hàm ý chất lượng — mọi món đều đã qua kiểm định như nhau.",
  ],
];

// M-01 · Gói thành viên (/membership) — khách cũng xem được, bấm chọn thì mời đăng nhập
export default function PlansScreen() {
  const { cycle: cycleParam } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [cycle, setCycle] = useState(
    cycleParam === BILLING_CYCLE.YEARLY ? BILLING_CYCLE.YEARLY : BILLING_CYCLE.MONTHLY,
  );
  const plans = usePlans();
  const mine = useMyMembership();
  const wallet = useWallet();
  const me = mine.data;

  const header = <AppHeader title="Gói thành viên" onBack={goBack} />;
  if (plans.isPending || (isAuthed && mine.isPending)) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  const error = plans.error ?? mine.error;
  if (error) {
    return (
      <Screen header={header}>
        <ErrorBox message={error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => {
              plans.refetch();
              mine.refetch();
            }}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const list = plans.data ?? [];
  const saving = maxYearlySaving(list);

  const choose = (plan) => {
    const href = `/membership/subscribe?planId=${plan.id}&cycle=${cycle}`;
    if (!isAuthed)
      return askLogin(href, "Cần đăng nhập", "Đăng nhập để mua gói thành viên.");
    router.push(href);
  };

  return (
    <Screen scroll header={header} contentStyle={styles.content}>
      {isAuthed ? (
        <StatusCard me={me} balance={wallet.data?.availableBalance} />
      ) : null}

      <View style={styles.cycleRow}>
        <SegmentTabs
          items={[
            { key: BILLING_CYCLE.MONTHLY, label: "Theo tháng" },
            { key: BILLING_CYCLE.YEARLY, label: "Theo năm" },
          ]}
          value={cycle}
          onChange={setCycle}
        />
        {saving > 0 ? (
          <Text style={styles.saving}>
            Mua theo năm tiết kiệm đến {saving}%
          </Text>
        ) : null}
      </View>

      {list.length ? (
        list.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            cycle={cycle}
            current={hasPaidPlan(me) && me.tier === p.tier}
            action={planAction(p, me)}
            onPress={() => choose(p)}
          />
        ))
      ) : (
        <EmptyState
          icon="ribbon-outline"
          title="Chưa có gói nào đang bán"
          description="Quay lại sau nhé."
        />
      )}

      <Text style={styles.note}>
        Sản phẩm nổi bật chỉ áp dụng cho hàng đang bán trên sàn. Gói không
        thay đổi hoa hồng, phí rút hàng hay kỳ ký gửi ghi trong biên nhận.
      </Text>

      <View style={styles.faq}>
        <Text style={styles.faqTitle}>Câu hỏi thường gặp</Text>
        {FAQ.map(([q, a]) => (
          <View key={q} style={styles.faqItem}>
            <Text style={styles.faqQ}>{q}</Text>
            <Text style={styles.faqA}>{a}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

// Thẻ "Bạn đang dùng gói…" + số dư ví (để biết trả bằng ví được không)
function StatusCard({ me, balance }) {
  const paid = hasPaidPlan(me);
  const soon = isExpiringSoon(me);
  return (
    <View style={[styles.status, soon && styles.statusWarn]}>
      <Text style={styles.statusLabel}>Bạn đang dùng gói</Text>
      <Text style={styles.statusName}>
        {paid
          ? `${me.tierName} · còn ${me.daysRemaining} ngày`
          : me?.tierName ?? "Thành viên thường"}
      </Text>
      <Text style={styles.statusDesc}>
        {paid
          ? `Hết hạn ${dayjs(me.expiresAt).format("DD/MM/YYYY")}. ${soon ? "Gia hạn ngay để không bị về Thành viên thường." : "Gia hạn cùng gói thì thời gian được cộng dồn."}`
          : "Nâng cấp để thử đồ nhiều hơn, nhận voucher mỗi tháng và được ưu tiên hiển thị khi ký gửi."}
      </Text>
      {balance != null ? (
        <Text style={styles.statusDesc}>
          Số dư Ví ReHome: {formatVnd(balance)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg, paddingBottom: spacing.xxl },
  status: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.highlight,
  },
  statusWarn: { backgroundColor: tones.warning.bg },
  statusLabel: { ...textStyles.caption, color: colors.textSecondary },
  statusName: { ...textStyles.heading, color: colors.text },
  statusDesc: { ...textStyles.body, color: colors.textSecondary },
  cycleRow: { gap: spacing.sm },
  saving: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textAlign: "center",
  },
  note: { ...textStyles.caption, color: colors.textSecondary },
  faq: { gap: spacing.md },
  faqTitle: { ...textStyles.heading, color: colors.text },
  faqItem: { gap: 2 },
  faqQ: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  faqA: { ...textStyles.body, color: colors.textSecondary },
});
