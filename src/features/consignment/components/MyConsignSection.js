import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import {
  CONSIGN_LIMITS,
  CONSIGN_STAGE as G,
  CONSIGN_STAGE_TABS,
} from "@/constants/consignment";
import { useMyConsignItems } from "@/features/consignment/hooks/useMyConsignItems";
import { FormCard } from "./FormCard";
import { ProductCard } from "./ProductCard";

// Giải thích ngắn cách ký gửi (link dưới trạng thái rỗng)
const showHowItWorks = () =>
  Alert.alert(
    "Ký gửi hoạt động thế nào?",
    "1. Gửi yêu cầu: chọn địa điểm ký gửi, thêm ảnh và thông tin từng món.\n" +
      "2. ReHome duyệt từng món (thường 1–2 ngày làm việc).\n" +
      "3. Mang đồ đến địa điểm ký gửi trong 7 ngày, nhân viên kiểm định và chốt giá với bạn.\n" +
      "4. Bạn xác nhận biên nhận trên app → hàng lên sàn.",
  );

// Tab trống (khi vẫn có món ở tab khác)
const EMPTY = {
  [G.PENDING]: "Không có món nào đang chờ duyệt.",
  [G.BRING]: "Không có món nào cần mang tới.",
  [G.SELLING]:
    "Chưa có món nào đang bán. Món lên sàn sau khi bạn xác nhận biên nhận.",
  [G.SOLD]: "Chưa bán được món nào.",
  [G.ENDED]: "Không có món nào đã kết thúc.",
};

// Thanh tab cuộn ngang: nhãn + số món + chấm đỏ nếu có việc chờ CHÍNH bạn làm
function StageTabs({ value, onChange, stages }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
    >
      {CONSIGN_STAGE_TABS.map((t) => {
        const list = stages[t.value];
        const active = t.value === value;
        const alert = list.some((i) => i.needsAction);
        return (
          <Pressable
            key={t.value}
            onPress={() => onChange(t.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {t.label}
              {list.length ? ` ${list.length}` : ""}
            </Text>
            {alert ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// "Đồ ký gửi của tôi": mỗi dòng là MỘT MÓN, chia tab theo hành trình
// (yêu cầu dùng FormCard, sản phẩm dùng ProductCard — cả hai đều có ảnh, giá, việc cần làm)
export function MyConsignSection() {
  const query = useMyConsignItems();
  const { stages } = query;
  const [picked, setPicked] = useState(null); // null = chưa bấm tab nào

  // Lần đầu: tự mở tab có việc cần làm → tab đầu có món → Chờ duyệt
  const autoTab =
    CONSIGN_STAGE_TABS.find((t) => stages[t.value].some((i) => i.needsAction))
      ?.value ??
    CONSIGN_STAGE_TABS.find((t) => stages[t.value].length)?.value ??
    G.PENDING;
  const tab = picked ?? autoTab;

  if (query.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      </View>
    );
  }

  const total = Object.values(stages).reduce((n, l) => n + l.length, 0);
  const pendingCount = stages[G.PENDING].length;

  const header = (
    <View style={styles.header}>
      <StageTabs value={tab} onChange={setPicked} stages={stages} />
      {tab === G.PENDING && pendingCount > 0 ? (
        <Text style={styles.info}>
          Đang có{" "}
          <Text style={styles.bold}>
            {pendingCount}/{CONSIGN_LIMITS.MAX_PENDING_FORMS}
          </Text>{" "}
          yêu cầu chờ duyệt. Đủ {CONSIGN_LIMITS.MAX_PENDING_FORMS} thì chưa gửi
          thêm được.
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={stages[tab]}
      keyExtractor={(i) => i.key}
      renderItem={({ item }) =>
        item.kind === "form" ? (
          <FormCard
            form={item.data}
            onPress={() => router.push(`/consign-forms/${item.data.id}`)}
          />
        ) : (
          <ProductCard
            product={item.data}
            onPress={() => router.push(`/my-products/${item.data.id}`)}
          />
        )
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        total === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Chưa có món ký gửi nào"
            description="Gửi thông tin món đồ, ReHome duyệt xong bạn mới mang đến. Không mất phí đăng, không bán được cũng không mất gì."
          >
            <Button
              title="Ký gửi món đầu tiên"
              onPress={() => router.push("/consign-forms/new")}
            />
            <Button
              title="Ký gửi hoạt động thế nào?"
              variant="text"
              onPress={showHowItWorks}
            />
          </EmptyState>
        ) : (
          <Text style={styles.emptyTab}>{EMPTY[tab]}</Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={query.refetch}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.md },
  tabs: { gap: spacing.sm },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  tabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  pressed: { opacity: 0.8 },
  tabText: { ...textStyles.body, color: colors.text },
  tabTextActive: { fontFamily: fonts.semibold, color: colors.onPrimary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  info: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  gap: { height: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  padded: { padding: spacing.lg },
  emptyTab: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
