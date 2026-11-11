import { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { showToast } from "@/utils/toast";
import { ERROR_CODES } from "@/constants/errorCodes";
import { useAuthStore } from "@/stores/authStore";
import { makeCampaignSchema } from "@/features/orgPortal/schemas";
import { campaignToForm } from "@/features/orgPortal/utils/campaignRules";
import {
  clearCampaignDraft,
  loadCampaignDraft,
  saveCampaignDraft,
} from "@/features/orgPortal/utils/campaignDraft";
import { useCreateCampaign } from "@/features/orgPortal/hooks/useCampaignMutations";
import { usePruneWarehouses } from "@/features/orgPortal/hooks/usePruneWarehouses";
import { CampaignForm } from "@/features/orgPortal/components/CampaignForm";

const schema = makeCampaignSchema();
const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/org/campaigns");

// OC-02 · Tạo chiến dịch. "Lưu nháp" lưu trên máy (BE không có nháp); mở lại màn có nháp → hỏi tiếp tục
export default function CreateCampaignScreen() {
  const user = useAuthStore((s) => s.user);
  const owner = user?.email;
  const create = useCreateCampaign();
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: campaignToForm(null),
  });
  const pruneWarehouses = usePruneWarehouses({ getValues, setValue });

  // Có nháp của tài khoản này → hỏi tiếp tục hay bỏ
  useEffect(() => {
    let alive = true;
    loadCampaignDraft(owner).then((draft) => {
      if (!alive || !draft) return;
      Alert.alert(
        "Tiếp tục bản nháp?",
        `Bạn có bản nháp chiến dịch lưu lúc ${dayjs(draft.savedAt).format("HH:mm DD/MM")}.`,
        [
          {
            text: "Bỏ nháp",
            style: "destructive",
            onPress: clearCampaignDraft,
          },
          {
            text: "Tiếp tục",
            // giữ defaultValues trống → form tính là "đã sửa", bấm ← vẫn được hỏi.
            // Nháp có thể giữ mã kho đã không còn → bỏ luôn, báo nếu có
            onPress: () => {
              reset(draft.values, { keepDefaultValues: true });
              pruneWarehouses()
                .then(
                  (n) =>
                    n > 0 &&
                    showToast(
                      `Đã bỏ ${n} địa điểm ký gửi không còn nhận đồ khỏi nháp`,
                    ),
                )
                .catch(() => {});
            },
          },
        ],
      );
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ hỏi nháp 1 lần khi mở màn
  }, [owner, reset]);

  const saveDraft = async () => {
    if (!isDirty) return showToast("Chưa nhập gì để lưu nháp");
    try {
      await saveCampaignDraft(owner, getValues());
      showToast("Đã lưu nháp trên máy này");
      leave();
    } catch {
      Alert.alert("Chưa lưu được nháp", "Bộ nhớ máy có thể đã đầy.");
    }
  };

  const onBack = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ chiến dịch đang soạn?", "Lưu nháp để lần sau soạn tiếp.", [
      { text: "Soạn tiếp", style: "cancel" },
      { text: "Bỏ", style: "destructive", onPress: leave },
      { text: "Lưu nháp", onPress: saveDraft },
    ]);
  };

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => {
        clearCampaignDraft();
        showToast("Đã đăng chiến dịch");
        leave();
      },
      onError: (e) => {
        if (e.code === ERROR_CODES.CAMPAIGN_WAREHOUSE_INVALID)
          pruneWarehouses().catch(() => {});
        if (e.code === ERROR_CODES.CAMPAIGN_LIMIT_REACHED)
          Alert.alert("Chưa tạo được chiến dịch", e.message, [
            { text: "Lưu nháp", onPress: saveDraft },
            { text: "Về danh sách", onPress: leave },
          ]);
      },
    }),
  );

  return (
    <Screen
      scroll
      header={<AppHeader title="Tạo chiến dịch" onBack={onBack} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Đăng chiến dịch"
            onPress={onSubmit}
            loading={create.isPending}
            style={styles.footerButton}
          />
          <Button
            title="Lưu nháp"
            variant="secondary"
            onPress={saveDraft}
            disabled={create.isPending}
            style={styles.footerButton}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      {create.isError &&
      create.error.code !== ERROR_CODES.CAMPAIGN_LIMIT_REACHED ? (
        <ErrorBox message={create.error.message} />
      ) : null}
      <CampaignForm
        control={control}
        errors={errors}
        ownAddress={user?.donationPointAddress ?? user?.address}
        ownHours={user?.donationPointReceivingHours}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1 },
});
