import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";
import { registrationFromProfile } from "@/features/organization/utils/payload";
import { optionLabel } from "@/features/organization/utils/summary";
import { useOrgOptions } from "@/features/organization/hooks/useOrgOptions";
import {
  DEFAULT_DOC_SUGGESTIONS,
  DOC_SUGGESTIONS,
} from "@/features/organization/constants";
import {
  ORG_STATUS,
  useMyOrganization,
} from "@/features/organization/hooks/useMyOrganization";

const CHECKLIST = [
  "Giấy phép / quyết định thành lập (ảnh hoặc PDF)",
  "CCCD hai mặt của người đại diện",
  "Địa chỉ và giờ nhận đồ quyên góp",
];

function StatusCard({
  icon,
  iconColor = colors.primary,
  title,
  text,
  children,
}) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={32} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {children}
    </View>
  );
}

const formatDate = (v) => dayjs(v).format("DD/MM/YYYY");
const formatDay = (v) => dayjs(v).format("DD/MM");

function DocRow({ icon, title, meta, url }) {
  return (
    <Pressable
      onPress={() => url && Linking.openURL(url)}
      disabled={!url}
      accessibilityRole="button"
      style={({ pressed }) => [styles.docRow, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <Text style={styles.docMeta}>{meta}</Text> : null}
      </View>
      {url ? <Text style={styles.link}>Xem</Text> : null}
    </Pressable>
  );
}

// OA-06 Bị từ chối · Giấy tờ đã nộp. BE không trả kết quả từng giấy tờ (đạt / chưa đạt) → chỉ liệt kê,
// so số giấy tờ với checklist của loại hình (giống bảng Moderator dùng) để nhắc phần còn thiếu
function SubmittedDocs({ profile, options }) {
  const docs = profile.documents ?? [];
  const rep = profile.representative;
  const required = DOC_SUGGESTIONS[profile.orgType] ?? DEFAULT_DOC_SUGGESTIONS;
  const missing = Math.max(0, required.length - docs.length);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>GIẤY TỜ ĐÃ NỘP</Text>
      <View style={styles.docBox}>
        {rep?.cccdFrontUrl || rep?.cccdBackUrl ? (
          <DocRow
            icon="card-outline"
            title="CCCD người đại diện"
            meta={[rep.fullName, rep.cccdNumber].filter(Boolean).join(" · ")}
            url={rep.cccdFrontUrl ?? rep.cccdBackUrl}
          />
        ) : null}
        {docs.map((d, i) => (
          <DocRow
            key={`${d.fileUrl}-${i}`}
            icon="document-text-outline"
            title={d.docType || `Giấy tờ ${i + 1}`}
            meta={[
              d.docNumber,
              d.issueDate ? `cấp ${formatDate(d.issueDate)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            url={d.fileUrl}
          />
        ))}
      </View>
      {missing > 0 ? (
        <Text style={styles.warn}>
          {optionLabel(options?.orgTypes, profile.orgType) || "Loại hình này"}{" "}
          cần ít nhất {required.length} giấy tờ, hồ sơ mới có {docs.length}:{" "}
          {required.join("; ")}.
        </Text>
      ) : null}
    </View>
  );
}

// Màn đầu của tài khoản Tổ chức — trạng thái hồ sơ lấy từ GET /api/organizations/me:
// chưa nộp → mời nộp · PENDING → đang xác minh · REJECTED → lý do + nộp lại · VERIFIED → khung 4 tab
export default function OrgHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);
  const setMode = useOrgRegisterStore((s) => s.setMode);
  const reset = useOrgRegisterStore((s) => s.reset);
  const me = useMyOrganization();
  const options = useOrgOptions();
  const { refetch } = me;

  // Quay lại màn này (vừa gửi hồ sơ, Moderator vừa duyệt…) → hỏi lại BE
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Chưa có kết quả mới thì dùng trạng thái lấy lúc đăng nhập (authStore) → VERIFIED vào tab ngay, không nháy màn
  const status = me.data
    ? me.data.verificationStatus
    : (user?.verificationStatus ?? null);

  const startRegister = () => {
    setMode("create");
    router.push("/org/registration/info");
  };
  // Bị từ chối: điền sẵn cả 4 bước từ hồ sơ cũ (ô BE không trả thì nhập lại)
  const startResubmit = () => {
    const steps = registrationFromProfile(me.data);
    reset();
    setMode("resubmit");
    Object.entries(steps).forEach(([key, data]) => saveStep(key, data));
    router.push("/org/registration/info");
  };

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  // OA-06 chỉ cho chưa nộp / PENDING / REJECTED. Đã xác minh → khung 4 tab (replace: không quay lại được)
  if (status === ORG_STATUS.VERIFIED) return <Redirect href="/org/campaigns" />;

  return (
    <Screen
      scroll
      header={<AppHeader title="Tổ chức" />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Đăng xuất"
          variant="secondary"
          onPress={confirmSignOut}
        />
      }
    >
      <Text style={styles.hello}>Đăng nhập với {user?.email}</Text>

      {me.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : me.isError ? (
        <ErrorBox message={me.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => refetch()}
          />
        </ErrorBox>
      ) : status === ORG_STATUS.PENDING ? (
        <StatusCard
          icon="hourglass-outline"
          title="Hồ sơ đang chờ xác minh"
          text={[
            me.data.submittedAt
              ? `Gửi ${formatDay(me.data.submittedAt)}`
              : null,
            "thường xử lý trong 1–2 ngày làm việc. Kết quả gửi về email đăng nhập.",
          ]
            .filter(Boolean)
            .join(" · ")}
        >
          <Button
            title="Kiểm tra lại"
            variant="secondary"
            loading={me.isRefetching}
            onPress={() => refetch()}
            style={styles.cta}
          />
        </StatusCard>
      ) : status === ORG_STATUS.REJECTED ? (
        <>
          <StatusCard
            icon="close-circle-outline"
            iconColor={colors.error}
            title="Hồ sơ chưa được duyệt"
            // Lúc từ chối BE ghi thời điểm vào verifiedAt ("ai kết luận, lúc nào")
            text={
              me.data.verifiedAt
                ? `Từ chối ngày ${formatDate(me.data.verifiedAt)}`
                : "Moderator đã từ chối hồ sơ."
            }
          />
          <View style={styles.reasonBox}>
            <Text style={styles.label}>LÝ DO TỪ CHỐI</Text>
            <Text style={styles.reason}>
              {me.data.rejectionReason || "Moderator không ghi lý do."}
            </Text>
          </View>
          <SubmittedDocs profile={me.data} options={options.data} />
          <NoteBox>
            Gửi lại thì chỉ cần bổ sung phần thiếu theo lý do trên. Thông tin và
            giấy tờ đã nộp được điền sẵn, không phải chụp lại.
          </NoteBox>
          <Button title="Bổ sung hồ sơ" onPress={startResubmit} />
        </>
      ) : (
        <View style={styles.card}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.title}>Nộp hồ sơ xác minh tổ chức</Text>
          <Text style={styles.text}>
            ReHome cần xác minh giấy tờ pháp lý trước khi tổ chức nhận đồ quyên
            góp và mở chiến dịch. Chuẩn bị sẵn:
          </Text>
          {CHECKLIST.map((item) => (
            <View key={item} style={styles.row}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.text}>{item}</Text>
            </View>
          ))}
          <Button
            title="Bắt đầu nộp hồ sơ"
            onPress={startRegister}
            style={styles.cta}
          />
        </View>
      )}

      {!me.isPending && !me.isError && !status ? (
        <NoteBox>
          Hồ sơ được duyệt trong 1–2 ngày làm việc. Kết quả gửi về email đăng
          nhập.
        </NoteBox>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  group: { gap: spacing.sm },
  label: { ...textStyles.label, color: colors.textSecondary },
  reasonBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: tones.danger.bg,
  },
  reason: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: tones.danger.fg,
  },
  docBox: {
    overflow: "hidden", // giấu vạch dưới của dòng cuối (trùng viền khung)
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: -1,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  docTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  docMeta: { ...textStyles.caption, color: colors.textSecondary },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  warn: { ...textStyles.caption, color: tones.warning.fg },
  hello: { ...textStyles.body, color: colors.textSecondary },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.heading,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  text: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cta: { marginTop: spacing.sm },
});
