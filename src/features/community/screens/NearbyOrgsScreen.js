import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { getCoords } from "@/utils/location";
import { useNearbyOrganizations } from "../hooks/useCommunity";
import { formatKm, mapsUrl } from "../utils/communityRules";
import { VerifiedBadge } from "../components/VerifiedBadge";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/community");
const SAMPLE_COORDS = { lat: 10.7769, lng: 106.7009 }; // [DEV] Quận 1 — gần các tổ chức mẫu
const RADIUS_KM = 5; // [KIỂM TRA] bán kính BE dùng (PHASE6_GUIDE câu 10)

function OrgRow({ item, onPress }) {
  const p = item.donationPoint ?? {};
  const n = item.activeCampaigns?.length ?? 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar
        uri={item.logoUrl}
        name={item.displayName}
        size={48}
        initialOf="first"
      />
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.displayName}
          </Text>
          <VerifiedBadge />
        </View>
        <Text style={styles.muted} numberOfLines={1}>
          {[item.orgTypeLabel, p.receivingHours].filter(Boolean).join(" · ")}
        </Text>
        <Text style={styles.strong}>
          {n
            ? `${n} chiến dịch đang nhận đồ`
            : "Chưa có chiến dịch đang nhận đồ"}
        </Text>
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => Linking.openURL(mapsUrl(p))}
        >
          Chỉ đường
        </Text>
      </View>
      <Text style={styles.km}>{formatKm(item.distanceKm)}</Text>
    </Pressable>
  );
}

// CD-05 · Tổ chức gần bạn — danh sách theo khoảng cách + Chỉ đường (không bản đồ — 0.5 A13)
export default function NearbyOrgsScreen() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [denied, setDenied] = useState(false);
  const query = useNearbyOrganizations(coords);

  const locate = useCallback(async () => {
    setLocating(true);
    const res = await getCoords();
    setLocating(false);
    if (res?.denied) return setDenied(true);
    setDenied(false);
    if (res) setCoords(res);
  }, []);

  useEffect(() => {
    if (isAuthed) locate();
  }, [isAuthed]);

  if (!isAuthed) return <Redirect href="/login" />;

  const list = query.data ?? [];
  const header = <AppHeader title="Tổ chức gần bạn" onBack={goBack} />;

  const mockPanel =
    __DEV__ && MOCK.community ? (
      <NoteBox>
        <View style={styles.mock}>
          <Text style={styles.muted}>Mock (chỉ bản dev)</Text>
          <Button
            title="Dùng vị trí mẫu (Quận 1)"
            variant="text"
            onPress={() => {
              setDenied(false);
              setCoords(SAMPLE_COORDS);
            }}
          />
        </View>
      </NoteBox>
    ) : null;

  // Chưa có toạ độ: đang lấy / bị từ chối / GPS lỗi
  if (!coords) {
    return (
      <Screen header={header} contentStyle={styles.content}>
        {locating ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>Đang lấy vị trí của bạn…</Text>
          </View>
        ) : denied ? (
          <NoteBox>
            <View style={styles.gapSm}>
              <Text style={styles.text}>
                Bật vị trí để xem tổ chức gần bạn. ReHome chỉ dùng vị trí để xếp
                theo khoảng cách, không lưu lại.
              </Text>
              <Button
                title="Mở cài đặt"
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            </View>
          </NoteBox>
        ) : (
          <ErrorBox message="Chưa lấy được vị trí. Thử ra chỗ thoáng hơn rồi thử lại.">
            <Button title="Thử lại" variant="secondary" onPress={locate} />
          </ErrorBox>
        )}
        {mockPanel}
      </Screen>
    );
  }

  let empty;
  if (query.isPending) {
    empty = <ActivityIndicator style={styles.loading} color={colors.primary} />;
  } else if (query.isError) {
    empty = (
      <ErrorBox message={query.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => query.refetch()}
        />
      </ErrorBox>
    );
  } else {
    empty = (
      <EmptyState
        icon="location-outline"
        title={`Chưa có tổ chức nào trong ${RADIUS_KM} km`}
        description="Xem các chiến dịch đang nhận đồ ở tab Cộng đồng."
      />
    );
  }

  return (
    <Screen header={header} padded={false}>
      {list.length ? (
        <View style={styles.strip}>
          <Text style={styles.strong}>{list.length} tổ chức gần bạn</Text>
          <Text style={styles.muted}>trong bán kính {RADIUS_KM} km</Text>
        </View>
      ) : null}
      <FlatList
        data={list}
        keyExtractor={(o) => o.organizationId}
        renderItem={({ item }) => (
          <OrgRow
            item={item}
            onPress={() => router.push(`/organizations/${item.organizationId}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={empty}
        ListFooterComponent={mockPanel}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xxl },
  gapSm: { gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
    backgroundColor: colors.surface,
  },
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  sep: { height: spacing.md },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: {
    flexShrink: 1,
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  link: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  km: { ...textStyles.body, fontFamily: fonts.semibold, color: colors.text },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
});
