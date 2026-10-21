import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { RadioCard } from "@/components/ui/RadioCard";
import { TextField } from "@/components/ui/TextField";
import { useAuthStore } from "@/stores/authStore";
import { REPORT_REASONS, REPORT_TARGET as T } from "@/constants/community";
import {
  useCampaign,
  useOrganization,
  usePost,
  useReport,
} from "../hooks/useCommunity";
import { buildReportReason, campaignTitleOf } from "../utils/communityRules";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");

// Khối tóm tắt đối tượng bị báo cáo — đổi theo targetType (dùng chung một màn)
function useTargetSummary(targetType, targetId) {
  const post = usePost(targetType === T.POST ? targetId : null);
  const campaign = useCampaign(targetType === T.CAMPAIGN ? targetId : null);
  const org = useOrganization(
    targetType === T.ORGANIZATION_ACCOUNT ? targetId : null,
  );
  if (targetType === T.POST && post.data) {
    const text = post.data.content ?? "";
    return {
      title: `Bài viết của ${post.data.organization?.displayName ?? "tổ chức"}`,
      detail: `“${text.length > 60 ? `${text.slice(0, 57)}…` : text}”`,
    };
  }
  if (targetType === T.CAMPAIGN && campaign.data) {
    return {
      title: `Chiến dịch của ${campaign.data.organization?.displayName ?? "tổ chức"}`,
      detail: campaignTitleOf(campaign.data),
    };
  }
  if (targetType === T.ORGANIZATION_ACCOUNT && org.data) {
    return { title: "Tài khoản tổ chức", detail: org.data.displayName };
  }
  return null;
}

// CD-06 · Báo cáo vi phạm (/report?targetType=&targetId=). Người bị báo cáo không biết ai báo
export default function ReportScreen() {
  const { targetType, targetId } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const summary = useTargetSummary(targetType, targetId);
  const report = useReport();
  const [reason, setReason] = useState(null);
  const [detail, setDetail] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  if (!isAuthed) return <Redirect href="/login" />;

  if (sent) {
    return (
      <Screen
        header={<AppHeader title="Báo cáo vi phạm" />}
        footer={<Button title="Đóng" variant="secondary" onPress={goBack} />}
      >
        <View style={styles.done}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={styles.doneTitle}>Đã gửi báo cáo</Text>
          <Text style={styles.mutedCenter}>
            Moderator sẽ xem xét trong thời gian sớm nhất. Bạn sẽ nhận thông báo
            nếu nội dung bị gỡ.
          </Text>
        </View>
      </Screen>
    );
  }

  const submit = () => {
    const next = {};
    if (!reason) next.reason = "Chọn một lý do báo cáo";
    if (reason === "OTHER" && detail.trim().length < 10)
      next.detail = "Mô tả lý do khác (ít nhất 10 ký tự)";
    setErrors(next);
    if (Object.keys(next).length) return;
    report.mutate(
      {
        targetType,
        targetId,
        reason: buildReportReason(reason, detail),
      },
      { onSuccess: () => setSent(true) },
    );
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Báo cáo vi phạm" onBack={goBack} />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Gửi báo cáo"
          loading={report.isPending}
          onPress={submit}
        />
      }
    >
      {summary ? (
        <View style={styles.summary}>
          <Text style={styles.strong}>{summary.title}</Text>
          <Text style={styles.muted} numberOfLines={2}>
            {summary.detail}
          </Text>
        </View>
      ) : null}

      <View style={styles.gapSm}>
        <Text style={styles.sectionTitle}>CHỌN LÝ DO *</Text>
        {REPORT_REASONS.map((r) => (
          <RadioCard
            key={r.key}
            title={r.label}
            selected={reason === r.key}
            onPress={() => setReason(r.key)}
            style={styles.radio}
          />
        ))}
        {errors.reason ? (
          <Text style={styles.error}>{errors.reason}</Text>
        ) : null}
      </View>

      <TextField
        label={
          reason === "OTHER" ? "Mô tả thêm" : "Mô tả thêm (không bắt buộc)"
        }
        required={reason === "OTHER"}
        multiline
        placeholder="Cho tụi mình biết thêm chi tiết nếu có…"
        value={detail}
        onChangeText={setDetail}
        maxLength={500}
        error={errors.detail}
      />

      {report.isError ? <ErrorBox message={report.error.message} /> : null}

      <NoteBox>
        Người bị báo cáo không biết ai đã báo cáo. Báo cáo sai sự thật nhiều lần
        có thể khiến tài khoản của bạn bị hạn chế.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  radio: { flex: 0 },
  summary: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  mutedCenter: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
  done: { alignItems: "center", gap: spacing.md, marginTop: spacing.xxl },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  doneTitle: { ...textStyles.heading, color: colors.text },
});
