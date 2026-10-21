import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { formatVnd } from "@/utils/money";
import { showToast } from "@/utils/toast";
import { daysLeft } from "@/utils/consignment";
import {
  FEE_PAYMENT_METHOD_LABEL,
  WITHDRAWAL_EVENT_LABEL,
  WITHDRAWAL_STATUS as W,
} from "@/constants/withdrawal";
import { withdrawalApi } from "../api/withdrawalApi";
import { useWithdrawal, useWithdrawalMutation } from "../hooks/useWithdrawals";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmt = (v) => dayjs(v).format("DD/MM HH:mm");

// Chữ phụ dưới từng mốc
const EVENT_DESC = {
  REMOVED: "Không ai mua được nữa",
};

// Dòng thời gian mới nhất ở trên (KG-15). Đang chờ đến kho → thêm mốc "Chờ bạn đến kho" đang chạy
function Timeline({ w }) {
  const items = w.events.map((e) => ({
    key: `${e.type}-${e.at}`,
    title: WITHDRAWAL_EVENT_LABEL[e.type] ?? e.type,
    desc:
      e.type === "HANDED_OVER" ? w.warehouseName : (EVENT_DESC[e.type] ?? null),
    right: fmt(e.at),
  }));
  if (w.status === W.PENDING_PICKUP) {
    items.unshift({
      key: "waiting",
      title: "Chờ bạn đến kho",
      right: `còn ${Math.max(0, daysLeft(w.pickupDeadline))} ngày`,
      active: true,
    });
  }
  return (
    <View>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <View key={it.key} style={styles.event}>
            <View style={styles.rail}>
              <View style={[styles.dot, it.active && styles.dotActive]} />
              {!last ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.eventBody}>
              <View style={styles.eventHead}>
                <Text style={[styles.strong, styles.flex]}>{it.title}</Text>
                <Text style={styles.caption}>{it.right}</Text>
              </View>
              {it.desc ? <Text style={styles.caption}>{it.desc}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// [DEV] Khung Mock: việc của kho / job hết hạn
function MockPanel({ w }) {
  const act = useWithdrawalMutation((key) =>
    withdrawalApi.mockWithdrawalAction(w.id, key),
  );
  if (!__DEV__ || !MOCK.withdrawals || w.status !== W.PENDING_PICKUP)
    return null;
  return (
    <NoteBox>
      <View style={styles.mock}>
        <Text style={styles.caption}>Mock (chỉ bản dev): việc của kho</Text>
        {withdrawalApi.MOCK_WITHDRAWAL_ACTIONS.map((a) => (
          <Button
            key={a.key}
            title={a.label}
            variant="text"
            disabled={act.isPending}
            onPress={() =>
              act.mutate(a.key, { onError: (e) => showToast(e.message) })
            }
          />
        ))}
      </View>
    </NoteBox>
  );
}

// KG-15 · Yêu cầu rút hàng: Chờ đến kho / Đã bàn giao / Hết hạn
export default function WithdrawalDetailScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useWithdrawal(id);
  const w = query.data;

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Yêu cầu rút hàng" onBack={goBack} />;
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
        {query.error.status === 404 || query.error.status === 403 ? (
          <EmptyState
            icon="cube-outline"
            title="Không tìm thấy yêu cầu rút hàng"
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

  const left = Math.max(0, daysLeft(w.pickupDeadline));

  let footer = null;
  if (w.status === W.PENDING_PICKUP) {
    // "Huỷ yêu cầu" ẩn — chưa có API (PHASE5_GUIDE 0.4 #6)
    footer = (
      <Button
        title="Mã Member của tôi"
        onPress={() => router.push("/profile/member-code")}
      />
    );
  } else if (w.status === W.COMPLETED) {
    footer = (
      <Button
        title="Về Hàng ký gửi"
        variant="secondary"
        onPress={() => router.replace("/consign")}
      />
    );
  } else if (w.status === W.EXPIRED) {
    footer = (
      <Button
        title="Xem sản phẩm đang bán"
        variant="secondary"
        onPress={() => router.replace(`/my-products/${w.productId}`)}
      />
    );
  }

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.productRow}>
        {w.photoUrl ? (
          <Image source={{ uri: w.photoUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumb} />
        )}
        <View style={styles.flex}>
          <Text style={styles.strong}>{w.productName}</Text>
          <Text style={styles.caption}>
            {w.productId} · {w.warehouseName}
          </Text>
        </View>
      </View>

      {/* ---- Khối theo trạng thái ---- */}
      {w.status === W.PENDING_PICKUP ? (
        <View style={[styles.box, styles.boxStrong]}>
          <Text style={styles.boxTitle}>Còn {left} ngày để đến kho</Text>
          <Text style={styles.text}>
            Hạn cuối{" "}
            <Text style={styles.strong}>
              {dayjs(w.pickupDeadline).format("DD/MM/YYYY")}
            </Text>
            . Sản phẩm đã gỡ khỏi sàn, không ai mua được.
          </Text>
          {w.warehouseAddress ? (
            <>
              <Text style={styles.muted}>
                {w.warehouseName} · {w.warehouseAddress}
              </Text>
              {w.warehouseOpeningHours ? (
                <Text style={styles.caption}>
                  Mở cửa {w.warehouseOpeningHours}
                </Text>
              ) : null}
              <Text
                style={styles.link}
                accessibilityRole="link"
                onPress={() =>
                  Linking.openURL(
                    `geo:0,0?q=${encodeURIComponent(w.warehouseAddress)}`,
                  )
                }
              >
                Chỉ đường
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {w.status === W.COMPLETED ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Đã bàn giao</Text>
          <Text style={styles.text}>
            Bạn đã nhận lại hàng tại {w.warehouseName}. Biên nhận ký gửi kết
            thúc.
          </Text>
        </View>
      ) : null}

      {w.status === W.EXPIRED ? (
        <View style={[styles.box, styles.boxStrong, styles.boxSoft]}>
          <Text style={styles.boxTitle}>Đã quá hạn — hàng đăng bán lại</Text>
          <Text style={styles.text}>
            Bạn không đến kho trong 7 ngày. Yêu cầu bị huỷ tự động, sản phẩm đã
            quay lại sàn và kỳ ký gửi tiếp tục như cũ.
          </Text>
        </View>
      ) : null}

      {/* ---- Phần chung ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRẠNG THÁI · MỚI NHẤT TRÊN CÙNG</Text>
        <Timeline w={w} />
      </View>

      {w.feeCharged > 0 ? (
        <View style={styles.feeRow}>
          <Text style={styles.muted}>Phí rút hàng</Text>
          <Text style={styles.strong}>
            {formatVnd(w.feeCharged)}
            {w.feePaymentMethod
              ? ` · đã trả ${FEE_PAYMENT_METHOD_LABEL[w.feePaymentMethod]}`
              : ""}
          </Text>
        </View>
      ) : null}

      {w.status === W.PENDING_PICKUP ? (
        <View style={styles.dashed}>
          <Text style={styles.text}>
            Đến quầy <Text style={styles.strong}>đọc mã Member</Text> để
            Moderator đối chiếu rồi bàn giao.{" "}
            <Text style={styles.strong}>Quá hạn không đến</Text> thì yêu cầu tự
            huỷ, sản phẩm đăng bán lại và kỳ ký gửi tiếp tục như cũ
            {w.feeCharged > 0 ? " — phí đã trả không được hoàn." : "."}
          </Text>
        </View>
      ) : null}

      {w.status === W.COMPLETED ? (
        <View style={styles.dashed}>
          <Text style={styles.text}>
            Hàng <Text style={styles.strong}>không còn trên ReHome</Text>. Muốn
            bán lại thì tạo form ký gửi mới — kỳ và hoa hồng tính lại từ đầu.
          </Text>
        </View>
      ) : null}

      <MockPanel w={w} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  text: { ...textStyles.body, color: colors.text },
  muted: { flexShrink: 1, ...textStyles.body, color: colors.textSecondary },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  link: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: { borderWidth: 2, borderColor: colors.text },
  boxSoft: { backgroundColor: colors.neutral },
  boxTitle: { ...textStyles.heading, color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  event: { flexDirection: "row", gap: spacing.md },
  rail: { width: 16, alignItems: "center" },
  dot: {
    width: 14,
    height: 14,
    marginTop: 3,
    borderRadius: 7,
    backgroundColor: colors.text,
  },
  dotActive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: colors.neutral,
  },
  eventBody: { flex: 1, gap: 2, paddingBottom: spacing.lg },
  eventHead: { flexDirection: "row", gap: spacing.sm },
  feeRow: { flexDirection: "row", justifyContent: "space-between" },
  dashed: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
});
