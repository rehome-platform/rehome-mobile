import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
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
import { daysLeft, formatRate } from "@/utils/consignment";
import {
  DEGRADED_CHOICE as C,
  DEGRADED_CHOICE_LABEL,
  DEGRADED_STATUS as S,
} from "@/constants/withdrawal";
import { PhotoThumbs } from "@/features/returns/components/PhotoThumbs";
import { degradedApi } from "../api/degradedApi";
import {
  useDegradedCase,
  useDegradedMutation,
} from "../hooks/useDegradedCases";
import { degradedAmount } from "../utils/withdrawalRules";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/consign");
const fmt = (v) => dayjs(v).format("DD/MM/YYYY");

// Thẻ lựa chọn có nút tròn + dòng số tiền bên trong (giống RT-04)
function OptionCard({ title, desc, amountLabel, amount, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionHead}>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <Text style={[styles.strong, styles.flex]}>{title}</Text>
      </View>
      <Text style={styles.muted}>{desc}</Text>
      <View style={styles.inner}>
        <Text style={styles.muted}>{amountLabel}</Text>
        <Text style={styles.amount}>{formatVnd(amount)}</Text>
      </View>
    </Pressable>
  );
}

// KG-16 · Hàng của bạn bị hỏng — chọn cách đền
export default function DegradedCaseScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useDegradedCase(id);
  const c = query.data;
  const [choice, setChoice] = useState(C.FULL_COMPENSATION); // = mặc định hệ thống nếu không chọn
  const decide = useDegradedMutation((ch) =>
    degradedApi.decideDegradedCase(id, ch),
  );
  const expire = useDegradedMutation(() => degradedApi.mockExpireDecision(id));

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Hàng của bạn bị hỏng" onBack={goBack} />;
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
          <EmptyState icon="cube-outline" title="Không tìm thấy ca hàng hỏng" />
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

  const pending = c.status === S.PENDING_DECISION;
  const full = degradedAmount(c, true);
  const partial = degradedAmount(c, false);
  const amount = choice === C.FULL_COMPENSATION ? full : partial;
  const left = c.decisionDeadline
    ? Math.max(0, daysLeft(c.decisionDeadline))
    : null;
  const pickupDays = c.pickupDeadline ? null : 30; // [GIẢ ĐỊNH theo wireframe] chỉ để mô tả trước khi chọn

  const confirm = () =>
    Alert.alert(
      `Nhận ${formatVnd(amount)}?`,
      choice === C.FULL_COMPENSATION
        ? "Món thuộc về kho, tiền đền cộng vào ví ngay. Không đổi lại được."
        : "Bạn đến kho lấy lại món hỏng, tiền đền một phần cộng vào ví ngay. Không đổi lại được.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () =>
            decide.mutate(choice, {
              onSuccess: (r) =>
                showToast(`Đã cộng ${formatVnd(r.paidAmount)} vào ví`),
              onError: (e) => {
                showToast(e.message);
                query.refetch(); // 409: đã chọn trước đó (vd hệ thống tự chọn)
              },
            }),
        },
      ],
    );

  let footer;
  if (pending) {
    footer = (
      <Button
        title={`Xác nhận nhận ${formatVnd(amount)}`}
        loading={decide.isPending}
        onPress={confirm}
      />
    );
  } else if (c.choice === C.PARTIAL_WITH_ITEM_BACK) {
    footer = (
      <View style={styles.footerRow}>
        <Button
          title="Xem ví"
          variant="secondary"
          onPress={() => router.push("/wallet")}
          style={styles.flex}
        />
        <Button
          title="Mã Member của tôi"
          onPress={() => router.push("/profile/member-code")}
          style={styles.flex}
        />
      </View>
    );
  } else {
    footer = <Button title="Xem ví" onPress={() => router.push("/wallet")} />;
  }

  return (
    <Screen
      scroll
      header={header}
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.banner}>
        <Text style={styles.muted}>
          {c.productName} · {c.productId}
        </Text>
        {pending && left != null ? (
          <Text style={styles.strong}>Còn {left} ngày</Text>
        ) : null}
      </View>

      <View style={[styles.box, styles.boxStrong, styles.boxSoft]}>
        <Text style={styles.boxTitle}>Món bị hỏng khi vận chuyển về kho</Text>
        <Text style={styles.text}>
          Người mua đã trả món này và kho nhận lại ngày{" "}
          {dayjs(c.receivedAt).format("DD/MM")}. {c.description}{" "}
          <Text style={styles.strong}>Không phải lỗi của bạn</Text>, và lần này
          không tính vào lịch sử ký gửi.
        </Text>
        <PhotoThumbs urls={c.damagePhotoUrls} />
        {c.damagePhotoUrls?.length ? (
          <Text style={styles.caption}>Ảnh kho chụp khi nhận lại</Text>
        ) : null}
      </View>

      {pending ? (
        <>
          <View style={styles.gapXs}>
            <Text style={styles.heading}>Bạn muốn ReHome xử lý thế nào?</Text>
            <Text style={styles.muted}>
              Kho đền vì lỗi nằm ở khâu vận chuyển do kho sắp xếp.
            </Text>
          </View>
          <OptionCard
            title={DEGRADED_CHOICE_LABEL.FULL_COMPENSATION}
            desc="Món thuộc về kho, bạn không phải tới lấy."
            amountLabel="Cộng vào ví"
            amount={full}
            selected={choice === C.FULL_COMPENSATION}
            onPress={() => setChoice(C.FULL_COMPENSATION)}
          />
          <OptionCard
            title={DEGRADED_CHOICE_LABEL.PARTIAL_WITH_ITEM_BACK}
            desc={`Đến kho lấy trong ${pickupDays} ngày. Món vẫn hỏng như ảnh trên. Không mất phí rút hàng.`}
            amountLabel={`Cộng vào ví · ${formatRate(c.degradedCompensationRate)}`}
            amount={partial}
            selected={choice === C.PARTIAL_WITH_ITEM_BACK}
            onPress={() => setChoice(C.PARTIAL_WITH_ITEM_BACK)}
          />
          {c.decisionDeadline ? (
            <View style={styles.dashed}>
              <Text style={styles.strong}>
                Nếu bạn không chọn trước {fmt(c.decisionDeadline)}
              </Text>
              <Text style={styles.text}>
                Hệ thống mặc định{" "}
                <Text style={styles.strong}>nhận tiền đền</Text> và cộng{" "}
                {formatVnd(full)} vào ví. Để im mà mất tiền thì vô lý, nên mặc
                định nghiêng về phía bạn.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.box, styles.boxStrong]}>
          <Text style={styles.boxTitle}>
            Bạn đã chọn: {DEGRADED_CHOICE_LABEL[c.choice] ?? c.choice}
          </Text>
          <Text style={styles.text}>
            Đã cộng <Text style={styles.strong}>{formatVnd(c.paidAmount)}</Text>{" "}
            vào ví ReHome
            {c.decidedAt
              ? ` lúc ${dayjs(c.decidedAt).format("DD/MM HH:mm")}`
              : ""}
            .
          </Text>
          {c.autoDecided ? (
            <Text style={styles.muted}>
              Hệ thống tự chọn vì quá hạn mà bạn chưa chọn.
            </Text>
          ) : null}
          {c.choice === C.PARTIAL_WITH_ITEM_BACK ? (
            <>
              <Text style={styles.text}>
                Đến <Text style={styles.strong}>{c.warehouseName}</Text> trước{" "}
                <Text style={styles.strong}>{fmt(c.pickupDeadline)}</Text>, đọc
                mã Member tại quầy để nhận lại hàng.
              </Text>
              {c.warehouseAddress ? (
                <>
                  <Text style={styles.muted}>{c.warehouseAddress}</Text>
                  <Text
                    style={styles.link}
                    accessibilityRole="link"
                    onPress={() =>
                      Linking.openURL(
                        `geo:0,0?q=${encodeURIComponent(c.warehouseAddress)}`,
                      )
                    }
                  >
                    Chỉ đường
                  </Text>
                </>
              ) : null}
            </>
          ) : (
            <Text style={styles.muted}>
              Món thuộc về kho, bạn không phải tới lấy.
            </Text>
          )}
        </View>
      )}

      {__DEV__ && MOCK.withdrawals && pending ? (
        <NoteBox>
          <View style={styles.mock}>
            <Text style={styles.caption}>Mock (chỉ bản dev)</Text>
            <Button
              title="Quá hạn chọn → hệ thống tự chọn"
              variant="text"
              loading={expire.isPending}
              onPress={() => expire.mutate()}
            />
          </View>
        </NoteBox>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  gapXs: { gap: spacing.xs },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  heading: { ...textStyles.heading, color: colors.text },
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
  amount: { ...textStyles.title, fontFamily: fonts.bold, color: colors.text },
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  boxStrong: { borderWidth: 2, borderColor: colors.text },
  boxSoft: { backgroundColor: colors.background },
  boxTitle: { ...textStyles.heading, color: colors.text },
  option: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background,
  },
  dashed: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
  mock: { gap: spacing.xs, alignItems: "flex-start" },
});
