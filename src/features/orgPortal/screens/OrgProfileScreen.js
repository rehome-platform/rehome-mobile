import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { StatusChip } from "@/components/ui/StatusChip";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { formatPhone } from "@/utils/format";
import { useAuthStore } from "@/stores/authStore";
import { useMyOrganization } from "@/features/organization/hooks/useMyOrganization";
import { useOrgOptions } from "@/features/organization/hooks/useOrgOptions";
import { optionLabel } from "@/features/organization/utils/summary";
import { useLegalChange } from "@/features/orgPortal/hooks/useLegalChange";
import { BellButton } from "@/features/notifications/components/BellButton";
import {
  changedFields,
  LEGAL_CHANGE_STATUS,
} from "@/features/orgPortal/utils/legalChange";

function InfoRow({ label, value, tag, pending = false, first = false }) {
  return (
    <View style={[styles.infoRow, first && styles.firstRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "—"}
      </Text>
      {pending ? (
        <StatusChip label="chờ duyệt" tone="info" />
      ) : tag ? (
        <Text style={styles.tag}>{tag}</Text>
      ) : null}
    </View>
  );
}

// Dải báo yêu cầu đổi pháp lý (chờ duyệt / bị từ chối) → bấm mở OP-05
function LegalChangeBanner({ status }) {
  const rejected = status === LEGAL_CHANGE_STATUS.REJECTED;
  return (
    <Pressable
      onPress={() => router.push("/org/my-profile/legal-status")}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: tones[rejected ? "danger" : "info"].bg },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          { color: tones[rejected ? "danger" : "info"].fg },
        ]}
      >
        {rejected
          ? "Yêu cầu đổi pháp lý bị từ chối"
          : "Yêu cầu đổi pháp lý đang chờ duyệt"}
      </Text>
      <Text style={styles.bannerLink}>Xem</Text>
    </Pressable>
  );
}

// OP-01 · Hồ sơ tổ chức (tab Hồ sơ): khối thông tin thường (sửa áp dụng ngay — OP-02) và khối pháp lý
// (đổi phải chờ Moderator duyệt — OP-04). Đăng xuất ở cuối màn (wireframe không vẽ, tổ chức cần lối ra)
export default function OrgProfileScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const me = useMyOrganization();
  const options = useOrgOptions();
  const legalChange = useLegalChange().data;
  const { refetch } = me;

  // Quay lại từ màn sửa → tải lại hồ sơ
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Chỉ yêu cầu đang chờ mới khoá nút Đổi pháp lý và đánh dấu dòng; bị từ chối thì chỉ hiện dải
  const status = legalChange?.status;
  const isPendingChange = status === LEGAL_CHANGE_STATUS.PENDING;
  const pendingFields = isPendingChange
    ? changedFields(legalChange.proposedChanges)
    : {};

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  const header = (
    <AppHeader
      title="Hồ sơ tổ chức"
      right={<BellButton href="/org/notifications" />}
    />
  );
  const p = me.data;

  if (!p) {
    return (
      <Screen header={header} edges={["top"]}>
        {me.isError ? (
          <ErrorBox message={me.error.message}>
            <Button title="Thử lại" variant="secondary" onPress={refetch} />
          </ErrorBox>
        ) : (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        )}
      </Screen>
    );
  }

  const rep = p.representative;
  const docCount = p.documents?.length ?? 0;
  const place = [p.donationPointAddress, p.donationPointReceivingHours]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen
      header={header}
      edges={["top"]}
      padded={false}
      footer={
        <View style={styles.footer}>
          <Button
            title="Sửa thông tin"
            onPress={() => router.push("/org/my-profile/edit")}
            style={styles.flex}
          />
          <Button
            title="Đổi pháp lý"
            variant="secondary"
            disabled={isPendingChange}
            onPress={() => router.push("/org/my-profile/legal")}
            style={styles.flex}
          />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={me.isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.head}>
          <Avatar
            uri={p.logoUrl}
            name={p.displayName}
            size={64}
            initialOf="first"
          />
          <View style={styles.flex}>
            <Text style={styles.name}>{p.displayName}</Text>
            {p.verifiedAt ? (
              <Text style={styles.verified}>
                Đã xác minh {dayjs(p.verifiedAt).format("DD/MM/YYYY")}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          THÔNG TIN THƯỜNG · SỬA ÁP DỤNG NGAY
        </Text>
        <View style={styles.box}>
          <InfoRow first label="Tên hiển thị" value={p.displayName} />
          <InfoRow label="Logo" value={p.logoUrl ? "Đã có" : "Chưa có"} />
          <InfoRow label="Mô tả" value={p.description} />
          <InfoRow
            label="Điện thoại"
            value={p.contactPhone ? formatPhone(p.contactPhone) : null}
          />
          <InfoRow label="Địa điểm nhận đồ" value={place} />
        </View>

        <Text style={styles.sectionTitle}>
          THÔNG TIN PHÁP LÝ · ĐỔI CẦN MODERATOR DUYỆT
        </Text>
        {status === LEGAL_CHANGE_STATUS.PENDING ||
        status === LEGAL_CHANGE_STATUS.REJECTED ? (
          <LegalChangeBanner status={status} />
        ) : null}
        <View style={[styles.box, styles.boxStrong]}>
          <InfoRow
            first
            label="Tên pháp lý"
            value={p.legalName}
            tag="cần duyệt"
            pending={pendingFields.legalName}
          />
          <InfoRow
            label="Loại hình"
            value={optionLabel(options.data?.orgTypes, p.orgType)}
            tag="cần duyệt"
            pending={pendingFields.orgType}
          />
          <InfoRow
            label="Người đại diện"
            value={
              rep
                ? [rep.fullName, rep.position].filter(Boolean).join(" · ")
                : null
            }
            tag="cần duyệt"
            pending={pendingFields.representative}
          />
          <InfoRow
            label="Giấy tờ"
            value={docCount ? `${docCount} tệp đã xác minh` : null}
            tag="cần duyệt"
            pending={pendingFields.documents}
          />
        </View>

        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  content: { gap: spacing.md, padding: spacing.lg },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { ...textStyles.title, color: colors.text },
  verified: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    ...textStyles.label,
    color: colors.textSecondary,
  },
  box: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  boxStrong: { borderWidth: 2, borderColor: colors.primary },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  firstRow: { borderTopWidth: 0 }, // dòng đầu khung không kẻ trên (khung đã có viền)
  infoLabel: {
    width: 110,
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  infoValue: { flex: 1, ...textStyles.body, color: colors.text },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    ...textStyles.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  logout: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  footer: { flexDirection: "row", gap: spacing.md },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
  },
  bannerText: { flex: 1, ...textStyles.body, fontFamily: fonts.semibold },
  bannerLink: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
