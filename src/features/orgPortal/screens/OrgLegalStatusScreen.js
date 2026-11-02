import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { StatusChip } from "@/components/ui/StatusChip";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { useOrgOptions } from "@/features/organization/hooks/useOrgOptions";
import { optionLabel } from "@/features/organization/utils/summary";
import {
  legalChangeKeys,
  useLegalChange,
} from "@/features/orgPortal/hooks/useLegalChange";
import {
  changeRows,
  LEGAL_CHANGE_STATUS,
} from "@/features/orgPortal/utils/legalChange";
import { saveLegalChangeRecord } from "@/features/orgPortal/utils/legalChangeRecord";

const toProfile = () => router.replace("/org/profile");
const leave = () => (router.canGoBack() ? router.back() : toProfile());
const formatDate = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : null);

// Chờ duyệt dùng tone info (ReHome đang xử lý, tổ chức không cần làm gì), không dùng warning
const VIEW = {
  [LEGAL_CHANGE_STATUS.PENDING]: {
    title: "Chờ duyệt",
    tag: "cần duyệt",
    tone: "info",
  },
  [LEGAL_CHANGE_STATUS.APPROVED]: {
    title: "Đã duyệt · đã áp dụng",
    tag: "✓ áp dụng",
    tone: "success",
  },
  [LEGAL_CHANGE_STATUS.REJECTED]: {
    title: "Bị từ chối",
    tag: "bị từ chối",
    tone: "danger",
  },
};

const MOCK_ACTIONS = [
  { status: LEGAL_CHANGE_STATUS.PENDING, label: "Về Chờ duyệt" },
  { status: LEGAL_CHANGE_STATUS.APPROVED, label: "Giả lập Moderator duyệt" },
  { status: LEGAL_CHANGE_STATUS.REJECTED, label: "Giả lập Moderator từ chối" },
];

// [DEV] BE chưa có API đọc yêu cầu → không xem được Đã duyệt / Bị từ chối thật. Chỉ đổi bản lưu trên máy:
// yêu cầu thật trên BE vẫn đang chờ (gửi lại lúc này BE sẽ chặn vì còn yêu cầu chờ)
function LegalMockPanel({ record }) {
  const owner = useAuthStore((s) => s.user?.email);
  const queryClient = useQueryClient();
  if (!__DEV__) return null;
  const setStatus = async (status) => {
    const reviewed = status !== LEGAL_CHANGE_STATUS.PENDING;
    await saveLegalChangeRecord(owner, {
      ...record,
      status,
      reviewedAt: reviewed ? new Date().toISOString() : null,
      rejectReason:
        status === LEGAL_CHANGE_STATUS.REJECTED
          ? "Quyết định đổi tên chưa có dấu của cơ quan cấp. Vui lòng nộp bản có dấu."
          : null,
    });
    queryClient.invalidateQueries({ queryKey: legalChangeKeys.mine });
  };
  return (
    <NoteBox>
      <View style={styles.mock}>
        <Text style={styles.label}>
          Mock (chỉ bản dev): chỉ đổi trên máy, BE vẫn giữ yêu cầu thật
        </Text>
        {MOCK_ACTIONS.filter((a) => a.status !== record.status).map((a) => (
          <Button
            key={a.status}
            title={a.label}
            variant="text"
            onPress={() => setStatus(a.status)}
          />
        ))}
      </View>
    </NoteBox>
  );
}

// OP-05 · Trạng thái yêu cầu đổi pháp lý: Chờ duyệt / Đã duyệt · đã áp dụng / Bị từ chối (+ lý do, gửi lại)
export default function OrgLegalStatusScreen() {
  const request = useLegalChange();
  const options = useOrgOptions();
  const header = <AppHeader title="Yêu cầu đổi pháp lý" onBack={leave} />;
  const r = request.data;

  if (!r) {
    return (
      <Screen header={header}>
        {request.isPending ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : (
          <Text style={[styles.text, styles.loading]}>
            Chưa có yêu cầu đổi thông tin pháp lý nào trên máy này.
          </Text>
        )}
      </Screen>
    );
  }

  const view = VIEW[r.status] ?? VIEW[LEGAL_CHANGE_STATUS.PENDING];
  const rows = changeRows(r.proposedChanges, (v) =>
    optionLabel(options.data?.orgTypes, v),
  );
  const footer =
    r.status === LEGAL_CHANGE_STATUS.APPROVED ? (
      <Button title="Xem hồ sơ tổ chức" onPress={toProfile} />
    ) : r.status === LEGAL_CHANGE_STATUS.REJECTED ? (
      <Button
        title="Gửi lại yêu cầu"
        onPress={() =>
          router.replace({
            pathname: "/org/my-profile/legal",
            params: { resubmit: "1" },
          })
        }
      />
    ) : null;

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.statusCard}>
        <StatusChip label={view.title} tone={view.tone} />
        {r.status === LEGAL_CHANGE_STATUS.PENDING ? (
          <Text style={styles.text}>
            Đã gửi {formatDate(r.createdAt)} · thường xử lý trong 1–2 ngày làm
            việc. Hồ sơ công khai vẫn giữ thông tin cũ cho tới khi duyệt xong.
          </Text>
        ) : r.status === LEGAL_CHANGE_STATUS.APPROVED ? (
          <Text style={styles.text}>
            {r.reviewedAt ? `Duyệt ngày ${formatDate(r.reviewedAt)}. ` : ""}
            Hồ sơ tổ chức đã cập nhật thông tin mới.
          </Text>
        ) : (
          <Text style={styles.text}>
            Từ chối ngày {formatDate(r.reviewedAt) ?? "—"}. Hồ sơ giữ nguyên
            thông tin cũ.
          </Text>
        )}
      </View>

      {r.status === LEGAL_CHANGE_STATUS.REJECTED ? (
        <View style={styles.reasonBox}>
          <Text style={styles.label}>LÝ DO TỪ CHỐI</Text>
          <Text style={styles.text}>
            {r.rejectReason || "Moderator không ghi lý do."}
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>THÔNG TIN ĐÃ KHAI</Text>
      <View style={styles.box}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.row, i === 0 && styles.first]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
            <StatusChip label={view.tag} tone={view.tone} />
          </View>
        ))}
      </View>

      <LegalMockPanel record={r} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.md },
  text: { ...textStyles.body, color: colors.text },
  label: { ...textStyles.label, color: colors.textSecondary },
  statusCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  reasonBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  box: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  first: { borderTopWidth: 0 },
  rowLabel: { width: 110, ...textStyles.caption, color: colors.textSecondary },
  rowValue: { flex: 1, ...textStyles.body, color: colors.text },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
});
