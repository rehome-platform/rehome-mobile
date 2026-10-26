import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { useAuthStore } from "@/stores/authStore";
import { askLogin } from "@/utils/askLogin";
import { REPORT_TARGET } from "@/constants/community";
import { useCampaign } from "../hooks/useCommunity";
import {
  campaignDaysLeft,
  campaignTitleOf,
  isCampaignOpen,
  mapsUrl,
} from "../utils/communityRules";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { CONVERSATION_TYPE } from "@/constants/chat";
import { useOpenConversation } from "@/features/chat/hooks/useChat";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// CD-04 · Chiến dịch. Member tự mang đồ tới — không có nút "Quyên góp" (L-09)
export default function CampaignScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useCampaign(id);
  const c = query.data;
  const { open: openChat } = useOpenConversation();
  const here = `/campaigns/${id}`;
  const needLogin = () =>
    askLogin(
      here,
      "Đăng nhập để tương tác",
      "Đăng nhập để nhắn tin và báo cáo.",
    );

  const header = (
    <AppHeader
      title="Chiến dịch"
      onBack={goBack}
      right={
        c ? (
          <Button
            title="Báo cáo"
            variant="text"
            onPress={() =>
              isAuthed
                ? router.push({
                    pathname: "/report",
                    params: {
                      targetType: REPORT_TARGET.CAMPAIGN,
                      targetId: id,
                    },
                  })
                : needLogin()
            }
          />
        ) : null
      }
    />
  );

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
        {query.error.status === 404 ? (
          <EmptyState
            icon="megaphone-outline"
            title="Không tìm thấy chiến dịch"
          />
        ) : (
          <ErrorBox message={query.error.message}>
            <Button
              title="Thử lại"
              variant="secondary"
              onPress={() => query.refetch()}
            />
          </ErrorBox>
        )}
      </Screen>
    );
  }

  const open = isCampaignOpen(c);
  const org = c.organization;

  const footer = open ? (
    <View style={styles.footer}>
      <View style={styles.footerRow}>
        <Button
          title="Chỉ đường"
          onPress={() => Linking.openURL(mapsUrl(c))}
          style={styles.flex}
        />
        <Button
          title="Nhắn tin"
          variant="secondary"
          onPress={() =>
            openChat({
              type: CONVERSATION_TYPE.MEMBER_ORGANIZATION,
              counterpartId: org?.id,
              draft: `Mình muốn hỏi về chiến dịch "${campaignTitleOf(c)}": `,
              from: here,
            })
          }
          style={styles.flex}
        />
      </View>
      <Text style={styles.caption}>
        Bạn tự mang đồ tới — ReHome không vận chuyển và không nhận đồ hộ.
      </Text>
    </View>
  ) : null;

  return (
    <Screen scroll padded={false} header={header} footer={footer}>
      <View style={styles.cover}>
        {c.coverUrl ? (
          <Image source={{ uri: c.coverUrl }} style={StyleSheet.absoluteFill} />
        ) : null}
        <Text style={[styles.tag, !open && styles.tagClosed]}>
          {open ? "ĐANG NHẬN ĐỒ" : "ĐÃ ĐÓNG"}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{campaignTitleOf(c)}</Text>
        {org ? (
          <Pressable
            onPress={() => router.push(`/organizations/${org.id}`)}
            accessibilityRole="button"
            style={styles.orgRow}
          >
            <Avatar
              uri={org.logoUrl}
              name={org.displayName}
              size={32}
              initialOf="first"
            />
            <Text style={styles.text}>{org.displayName}</Text>
            {org.verified ? <VerifiedBadge /> : null}
          </Pressable>
        ) : null}

        <Section title={open ? "NHẬN ĐỒ TỚI HẾT" : "ĐÃ ĐÓNG"}>
          <Text style={styles.big}>
            {dayjs(c.endTime).format("DD/MM/YYYY")}
          </Text>
          {open ? (
            <Text style={styles.muted}>
              Còn {Math.max(0, campaignDaysLeft(c))} ngày
            </Text>
          ) : null}
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

        {/* Địa điểm của CHIẾN DỊCH (0.5 A15); không bản đồ trong app (A13) */}
        <Section title="MANG ĐỒ TỚI ĐÂU">
          <View style={styles.place}>
            <Text style={styles.strong}>{c.locationName}</Text>
            {c.address ? <Text style={styles.text}>{c.address}</Text> : null}
            {c.receivingHours ? (
              <Text style={styles.muted}>{c.receivingHours}</Text>
            ) : null}
          </View>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
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
  body: { gap: spacing.lg, padding: spacing.lg },
  title: { ...textStyles.title, color: colors.text },
  orgRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  section: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  big: { ...textStyles.heading, color: colors.text },
  text: { ...textStyles.body, color: colors.text },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  muted: { ...textStyles.caption, color: colors.textSecondary },
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
  place: {
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  footer: { gap: spacing.xs },
  footerRow: { flexDirection: "row", gap: spacing.md },
  caption: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
