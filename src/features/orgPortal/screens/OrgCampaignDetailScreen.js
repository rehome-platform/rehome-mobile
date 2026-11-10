import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  closedLabel,
  isCampaignHidden,
} from "@/features/orgPortal/utils/campaignRules";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { showToast } from "@/utils/toast";
import { useAuthStore } from "@/stores/authStore";
import {
  campaignDaysLeft,
  campaignTitleOf,
  isCampaignOpen,
} from "@/features/community/utils/communityRules";
import { useMyCampaign } from "@/features/orgPortal/hooks/useMyCampaign";
import { useCloseCampaign } from "@/features/orgPortal/hooks/useCampaignMutations";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/org/campaigns");

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Một dòng nơi nhận trong khối NƠI NHẬN ĐỒ: tên + địa chỉ (+ dòng phụ) bên trái, hành động bên phải
function PlaceRow({ title, lines, right, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.place, pressed && styles.pressed]}
    >
      <View style={styles.placeBody}>
        <Text style={styles.strong}>{title}</Text>
        {lines.filter(Boolean).map((line) => (
          <Text key={line} style={styles.muted}>
            {line}
          </Text>
        ))}
      </View>
      {right}
    </Pressable>
  );
}

// OC-03 · Chi tiết chiến dịch (wireframe 31/10). Thay khối số liệu (lượt xem, chia sẻ — không có số, B1)
// bằng khối NƠI NHẬN ĐỒ [GIẢ ĐỊNH, CHỜ LEAD L5]: địa chỉ riêng + "Ghi note" (OC-08), mỗi kho "n chờ lấy ›" (OC-07)
export default function OrgCampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const query = useMyCampaign(id);
  const close = useCloseCampaign(id);
  const { refetch } = query;

  // Quay lại từ màn sửa / đơn chờ lấy → số đơn có thể đã đổi
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const c = query.data;
  const open = isCampaignOpen(c);
  // Moderator ẩn do vi phạm: chỉ xem + lý do; BE chặn sửa / đóng / ghi note (409)
  const hidden = isCampaignHidden(c);

  const header = (
    <AppHeader
      title="Chiến dịch"
      onBack={goBack}
      right={
        c && open ? (
          <Button
            title="Sửa"
            variant="text"
            onPress={() => router.push(`/org/my-campaigns/${id}/edit`)}
          />
        ) : null
      }
    />
  );

  if (!c) {
    return (
      <Screen header={header}>
        {query.isError ? (
          <ErrorBox message={query.error.message}>
            <Button title="Thử lại" variant="secondary" onPress={refetch} />
          </ErrorBox>
        ) : (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        )}
      </Screen>
    );
  }

  const endLabel = dayjs(c.endTime).format("DD/MM");
  const confirmClose = () =>
    Alert.alert(
      "Đóng chiến dịch?",
      `Chiến dịch biến khỏi Cộng đồng ngay, không chờ tới ${endLabel}. Không mở lại được.`,
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Đóng sớm",
          style: "destructive",
          onPress: () =>
            close.mutate(undefined, {
              onSuccess: () => showToast("Đã đóng chiến dịch"),
              onError: (e) => Alert.alert("Chưa đóng được", e.message),
            }),
        },
      ],
    );

  // BE trả sẵn địa chỉ riêng trong chiến dịch (ownAddress); mock chưa có → lấy từ hồ sơ đăng nhập
  const ownAddress =
    c.ownAddress?.address ?? user?.donationPointAddress ?? user?.address;
  const ownHours =
    c.ownAddress?.receivingHours ?? user?.donationPointReceivingHours;

  return (
    <Screen
      header={header}
      padded={false}
      footer={
        open ? (
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Button
                title="Sửa chiến dịch"
                variant="secondary"
                onPress={() => router.push(`/org/my-campaigns/${id}/edit`)}
                style={styles.flex}
              />
              <Button
                title="Đóng sớm"
                variant="secondary"
                onPress={confirmClose}
                loading={close.isPending}
                style={styles.flex}
              />
            </View>
            <Text style={styles.caption}>
              Đóng sớm thì chiến dịch biến khỏi feed ngay, không chờ tới{" "}
              {endLabel}
            </Text>
          </View>
        ) : null
      }
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.cover}>
          {c.coverUrl ? (
            <Image
              source={{ uri: c.coverUrl }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Text
            style={[
              styles.tag,
              !open && styles.tagClosed,
              hidden && styles.tagHidden,
            ]}
          >
            {hidden ? "BỊ ẨN" : open ? "ĐANG NHẬN ĐỒ" : "ĐÃ ĐÓNG"}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{campaignTitleOf(c)}</Text>
            <Text style={styles.muted}>
              {/* "Đăng dd/MM" theo createdAt của chiến dịch */}
              {c.createdAt
                ? `Đăng ${dayjs(c.createdAt).format("DD/MM")} · `
                : ""}
              {hidden
                ? `hạn ${dayjs(c.endTime).format("DD/MM/YYYY")}`
                : open
                  ? `nhận tới ${endLabel} · còn ${Math.max(0, campaignDaysLeft(c))} ngày`
                  : closedLabel(c).replace(/^Đ/, "đ")}
            </Text>
          </View>

          {hidden ? (
            <View style={styles.hiddenBox}>
              <View style={styles.hiddenHead}>
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.hiddenTitle}>
                  Chiến dịch đang bị ẩn do vi phạm
                </Text>
              </View>
              <Text style={styles.text}>
                Lý do:{" "}
                <Text style={styles.strong}>
                  {c.hiddenReason || "ReHome chưa ghi lý do cụ thể."}
                </Text>
              </Text>
              <Text style={styles.muted}>
                Member không còn thấy chiến dịch này và không ghi nhận thêm
                quyên góp mới. Đồ đã ghi nhận trước đó vẫn được bàn giao bình
                thường. Chiến dịch vẫn tính vào số chiến dịch tối đa cho tới khi
                hết hạn. Cần trao đổi thêm, hãy nhắn cho ReHome.
              </Text>
            </View>
          ) : null}

          <Section title="NƠI NHẬN ĐỒ">
            {c.receiveAtOwnAddress ? (
              <PlaceRow
                title="Địa chỉ của tổ chức"
                lines={[ownAddress, ownHours]}
                // Cùng kiểu dòng kho: bấm cả dòng → danh sách note đã ghi (có nút Ghi note mới).
                // Đã đóng vẫn xem lại được. Số note lấy từ BE nếu có (donationNoteCount), chưa có thì chỉ ghi "Note"
                onPress={() =>
                  router.push(`/org/my-campaigns/${id}/donation-notes`)
                }
                right={
                  <View style={styles.countRow}>
                    <Text
                      style={[
                        styles.count,
                        c.donationNoteCount === 0 && styles.countZero,
                      ]}
                    >
                      {c.donationNoteCount != null
                        ? c.donationNoteCount
                          ? `${c.donationNoteCount} note`
                          : "Chưa có note"
                        : "Note"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                }
              />
            ) : null}
            {c.warehouses.map((w) => (
              <PlaceRow
                key={w.id}
                title={w.name}
                lines={[w.address]}
                onPress={() =>
                  router.push({
                    pathname: "/org/my-campaigns/[id]/donations",
                    params: { id, warehouseId: w.id },
                  })
                }
                right={
                  <View style={styles.countRow}>
                    <Text
                      style={[
                        styles.count,
                        w.pendingCount === 0 && styles.countZero,
                      ]}
                    >
                      {w.pendingCount
                        ? `${w.pendingCount} chờ lấy`
                        : "Chưa có đơn"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                }
              />
            ))}
          </Section>

          {c.preferredItemTypes?.length ? (
            <Section title="LOẠI ĐỒ ĐANG CẦN">
              <View style={styles.chips}>
                {c.preferredItemTypes.map((t) => (
                  <Text key={t} style={styles.chip}>
                    {t}
                  </Text>
                ))}
              </View>
            </Section>
          ) : null}

          <Section title="MÔ TẢ">
            <Text style={styles.text}>{c.description}</Text>
          </Section>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  cover: { aspectRatio: 16 / 9, backgroundColor: colors.neutral },
  tag: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    ...textStyles.label,
    fontFamily: fonts.bold,
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  tagClosed: { backgroundColor: colors.textSecondary },
  tagHidden: { backgroundColor: colors.error },
  hiddenBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  hiddenHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hiddenTitle: {
    flex: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  body: { gap: spacing.lg, padding: spacing.lg },
  titleBlock: { gap: spacing.xs },
  title: { ...textStyles.title, color: colors.text },
  section: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  place: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  placeBody: { flex: 1, gap: 2 },
  countRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  count: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  countZero: { fontFamily: fonts.regular, color: colors.textSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    ...textStyles.caption,
    color: colors.text,
  },
  footer: { gap: spacing.xs },
  footerRow: { flexDirection: "row", gap: spacing.md },
  caption: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
