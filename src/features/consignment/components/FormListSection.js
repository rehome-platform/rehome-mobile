import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { CONSIGN_LIMITS, FORM_STATUS } from "@/constants/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { usePendingFormCount } from "@/features/consignment/hooks/usePendingFormCount";
import { FormCard } from "./FormCard";

const ALL = "ALL";
const FILTERS = [
  { value: ALL, label: "Tất cả" },
  { value: FORM_STATUS.PENDING, label: "Chờ duyệt" },
  { value: FORM_STATUS.APPROVED, label: "Đã duyệt" },
  { value: FORM_STATUS.REJECTED, label: "Từ chối" },
];

// Giải thích ngắn cách ký gửi (link dưới trạng thái rỗng)
const showHowItWorks = () =>
  Alert.alert(
    "Ký gửi hoạt động thế nào?",
    "1. Gửi yêu cầu: ảnh, thông tin, giá mong muốn, chọn địa điểm ký gửi.\n" +
      "2. ReHome duyệt yêu cầu (thường 1–2 ngày làm việc).\n" +
      "3. Mang đồ đến địa điểm ký gửi trong 7 ngày, nhân viên kiểm định và chốt giá với bạn.\n" +
      "4. Bạn xác nhận biên nhận trên app → hàng lên sàn.",
  );

export function FormListSection() {
  const [filter, setFilter] = useState(ALL);
  const status = filter === ALL ? undefined : filter;

  // Phase 2 tạm lấy 1 trang 50 form (đủ cho 1 Member); phân trang vô hạn để sau
  const list = useQuery({
    queryKey: consignKeys.forms(status),
    queryFn: () => consignmentApi.getMyForms({ status, page: 0, size: 50 }),
  });
  const pending = usePendingFormCount();

  const onRefresh = () => {
    list.refetch();
    pending.refetch();
  };

  const header = (
    <View style={styles.header}>
      {pending.data > 0 ? (
        <Text style={styles.info}>
          Đang có{" "}
          <Text style={styles.bold}>
            {pending.data}/{CONSIGN_LIMITS.MAX_PENDING_FORMS}
          </Text>{" "}
          yêu cầu chờ duyệt. Đủ {CONSIGN_LIMITS.MAX_PENDING_FORMS} yêu cầu thì không
          tạo thêm được.
        </Text>
      ) : null}
      <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
    </View>
  );

  if (list.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (list.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBox message={list.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => list.refetch()}
          />
        </ErrorBox>
      </View>
    );
  }

  return (
    <FlatList
      data={list.data.content}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FormCard
          form={item}
          onPress={() => router.push(`/consign-forms/${item.id}`)}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        filter === ALL ? (
          <EmptyState
            icon="cube-outline"
            title="Chưa có yêu cầu ký gửi nào"
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
          <Text style={styles.emptyFilter}>
            Không có yêu cầu nào ở trạng thái này.
          </Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.md },
  info: { ...textStyles.body, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  gap: { height: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  padded: { padding: spacing.lg },
  emptyFilter: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
