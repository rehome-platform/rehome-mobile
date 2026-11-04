import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import { useAuthStore } from "@/stores/authStore";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { orgContentKeys } from "@/features/orgPortal/api/queryKeys";
import { makeCampaignSchema } from "@/features/orgPortal/schemas";
import {
  campaignToForm,
  isStartLocked,
  lockedWarehouseIds,
} from "@/features/orgPortal/utils/campaignRules";
import { useUpdateCampaign } from "@/features/orgPortal/hooks/useCampaignMutations";
import { usePruneWarehouses } from "@/features/orgPortal/hooks/usePruneWarehouses";
import { CampaignForm } from "@/features/orgPortal/components/CampaignForm";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/org/campaigns");

// Form chỉ dựng khi đã có dữ liệu chiến dịch (defaultValues của useForm chỉ đọc lần đầu)
function EditForm({ campaign }) {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateCampaign(campaign.id);
  const startLocked = isStartLocked(campaign);
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(
      makeCampaignSchema({ requireFutureStart: !startLocked }),
    ),
    defaultValues: campaignToForm(campaign),
  });
  const pruneWarehouses = usePruneWarehouses({ getValues, setValue });

  const onCancel = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ thay đổi?", "Những gì bạn vừa sửa sẽ không được lưu.", [
      { text: "Sửa tiếp", style: "cancel" },
      { text: "Bỏ thay đổi", style: "destructive", onPress: leave },
    ]);
  };

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: () => {
        showToast("Đã lưu thay đổi");
        leave();
      },
      onError: (e) => {
        if (e.code === ERROR_CODES.CAMPAIGN_WAREHOUSE_INVALID)
          pruneWarehouses().catch(() => {});
      },
    }),
  );

  return (
    <Screen
      scroll
      header={<AppHeader title="Sửa chiến dịch" onBack={onCancel} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Lưu thay đổi"
            onPress={onSubmit}
            loading={update.isPending}
            disabled={!isDirty} // chưa sửa gì → không có gì để lưu
            style={styles.footerButton}
          />
          <Button
            title="Huỷ"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      {update.isError ? (
        <ErrorBox
          message={
            update.error.code === ERROR_CODES.CAMPAIGN_WAREHOUSE_HAS_PENDING
              ? `${update.error.message} Chọn lại kho đó rồi lưu.`
              : update.error.message
          }
        />
      ) : null}
      <NoteBox>
        Lưu xong áp dụng ngay, không cần chờ duyệt — chiến dịch chỉ là lời kêu
        gọi, không ảnh hưởng tiền hay hàng ký gửi.
      </NoteBox>
      <CampaignForm
        control={control}
        errors={errors}
        startLocked={startLocked}
        lockedWarehouseIds={lockedWarehouseIds(campaign)}
        ownAddress={user?.donationPointAddress ?? user?.address}
        ownHours={user?.donationPointReceivingHours}
      />
    </Screen>
  );
}

// OC-04 · Sửa chiến dịch — dùng lại form OC-02, điền sẵn
export default function EditCampaignScreen() {
  const { id } = useLocalSearchParams();
  const query = useQuery({
    queryKey: orgContentKeys.campaign(id),
    queryFn: () => orgContentApi.getMyCampaign(id),
  });

  if (query.isSuccess) return <EditForm campaign={query.data} />;

  return (
    <Screen header={<AppHeader title="Sửa chiến dịch" onBack={leave} />}>
      {query.isError ? (
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      ) : (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1 },
  loading: { marginTop: spacing.xxl },
});
