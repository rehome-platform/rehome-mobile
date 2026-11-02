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
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { formatPhone } from "@/utils/format";
import { useAuthStore } from "@/stores/authStore";
import { useMyOrganization } from "@/features/organization/hooks/useMyOrganization";
import { useOrgOptions } from "@/features/organization/hooks/useOrgOptions";
import { optionLabel } from "@/features/organization/utils/summary";

function InfoRow({ label, value, tag }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "—"}
      </Text>
      {tag ? <Text style={styles.tag}>{tag}</Text> : null}
    </View>
  );
}

// OP-01 · Hồ sơ tổ chức (tab Hồ sơ): khối thông tin thường (sửa áp dụng ngay — OP-02) và khối pháp lý
// (đổi phải chờ Moderator duyệt — OP-04). Đăng xuất ở cuối màn (wireframe không vẽ, tổ chức cần lối ra)
export default function OrgProfileScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const me = useMyOrganization();
  const options = useOrgOptions();
  const { refetch } = me;

  // Quay lại từ màn sửa → tải lại hồ sơ
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  const header = <AppHeader title="Hồ sơ tổ chức" />;
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
            title="Sửa thông tin thường"
            onPress={() => router.push("/org/my-profile/edit")}
            style={styles.flex}
          />
          <Button
            title="Đổi pháp lý"
            variant="secondary"
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
          <InfoRow label="Tên hiển thị" value={p.displayName} />
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
        <View style={[styles.box, styles.boxStrong]}>
          <InfoRow label="Tên pháp lý" value={p.legalName} tag="cần duyệt" />
          <InfoRow
            label="Loại hình"
            value={optionLabel(options.data?.orgTypes, p.orgType)}
            tag="cần duyệt"
          />
          <InfoRow
            label="Người đại diện"
            value={
              rep
                ? [rep.fullName, rep.position].filter(Boolean).join(" · ")
                : null
            }
            tag="cần duyệt"
          />
          <InfoRow
            label="Giấy tờ"
            value={docCount ? `${docCount} tệp đã xác minh` : null}
            tag="cần duyệt"
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
    marginTop: -1, // dòng đầu không có kẻ trên
  },
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
});
