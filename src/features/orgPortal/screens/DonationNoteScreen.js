import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { TextField } from "@/components/ui/TextField";
import { showToast } from "@/utils/toast";
import { DONATION_NOTE_LIMITS } from "@/constants/donation";
import { campaignTitleOf } from "@/features/community/utils/communityRules";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { donationNoteSchema } from "@/features/orgPortal/schemas";
import { useMyCampaign } from "@/features/orgPortal/hooks/useMyCampaign";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/org/campaigns");

// OC-08 · Ghi note quyên góp — chỉ cho chiến dịch nhận tại địa chỉ riêng, không bắt buộc, hệ thống không theo dõi.
// Thêm dải tên chiến dịch dưới header [GIẢ ĐỊNH, CHỜ LEAD L8]. "Bỏ qua" và ← cùng hành vi: đã nhập thì hỏi trước
export default function DonationNoteScreen() {
  const { id } = useLocalSearchParams();
  const campaign = useMyCampaign(id);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(donationNoteSchema),
    defaultValues: { donorName: "", isAnonymous: false, note: "" },
  });
  const [isAnonymous, note] = useWatch({
    control,
    name: ["isAnonymous", "note"],
  });

  const save = useMutation({
    mutationFn: (values) => orgContentApi.createDonationNote(id, values),
    onSuccess: () => {
      showToast("Đã lưu note");
      goBack();
    },
  });

  const onSkip = () => {
    if (!isDirty) return goBack();
    Alert.alert(
      "Bỏ note đang ghi?",
      "Những gì bạn vừa nhập sẽ không được lưu.",
      [
        { text: "Ghi tiếp", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: goBack },
      ],
    );
  };

  // Tích Ẩn danh → xoá và khoá ô tên (không gửi donorName)
  const toggleAnonymous = (checked) => {
    setValue("isAnonymous", checked, { shouldDirty: true });
    if (checked)
      setValue("donorName", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Screen
      scroll
      header={
        <View>
          <AppHeader title="Ghi note quyên góp" onBack={onSkip} />
          {campaign.data ? (
            <View style={styles.strip}>
              <Text style={styles.stripText} numberOfLines={1}>
                {campaignTitleOf(campaign.data)}
              </Text>
            </View>
          ) : null}
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Button
            title="Lưu note"
            onPress={handleSubmit((values) => save.mutate(values))}
            loading={save.isPending}
            style={styles.footerButton}
          />
          <Button
            title="Bỏ qua"
            variant="secondary"
            onPress={onSkip}
            disabled={save.isPending}
            style={styles.footerButton}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      <View style={styles.explain}>
        <Text style={styles.explainText}>
          Dành cho chiến dịch nhận tại{" "}
          <Text style={styles.bold}>địa chỉ riêng</Text> của bạn. Mục này không
          bắt buộc — chỉ để bạn tự ghi lại ai đã mang đồ đến, hệ thống không
          theo dõi việc nhận đồ ngoài app.
        </Text>
      </View>

      {save.isError ? <ErrorBox message={save.error.message} /> : null}

      <View style={styles.group}>
        <Text style={styles.label}>Người quyên góp</Text>
        <View style={styles.donorRow}>
          <Controller
            control={control}
            name="donorName"
            render={({ field }) => (
              <TextField
                style={styles.donorField}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                editable={!isAnonymous}
                placeholder={isAnonymous ? "Ẩn danh" : "Tên người quyên góp"}
                autoCapitalize="words"
                maxLength={DONATION_NOTE_LIMITS.DONOR_NAME_MAX}
                error={errors.donorName?.message}
              />
            )}
          />
          <View style={styles.anonBox}>
            <Checkbox checked={isAnonymous} onChange={toggleAnonymous}>
              Ẩn danh
            </Checkbox>
          </View>
        </View>
        <Text style={styles.helper}>
          Để trống tên và tích "Ẩn danh" nếu bạn không hỏi hoặc người quyên góp
          không muốn nêu tên.
        </Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Note (tuỳ chọn)</Text>
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField
              multiline
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={DONATION_NOTE_LIMITS.NOTE_MAX}
              placeholder="Vd: Mang đến 1 túi áo ấm trẻ em và 2 chăn mỏng, đồ còn khá mới."
              helper={`${(note ?? "").length} / ${DONATION_NOTE_LIMITS.NOTE_MAX}`}
              error={errors.note?.message}
            />
          )}
        />
        <Text style={styles.helper}>
          Chỉ là chữ tự do — không có ô số lượng hay cân nặng.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  stripText: { ...textStyles.caption, color: colors.textSecondary },
  content: { gap: spacing.lg },
  explain: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  explainText: { ...textStyles.caption, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  group: { gap: spacing.xs },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  donorRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  donorField: { flex: 1 },
  anonBox: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  footer: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1 },
});
