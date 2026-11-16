import { StyleSheet, Text, View } from "react-native";
import { Controller, useWatch } from "react-hook-form";
import { colors, spacing, textStyles } from "@/theme";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { CAMPAIGN_STATUS, POST_LIMITS } from "@/constants/community";
import { PhotoPicker } from "@/features/consignment/components/PhotoPicker";
import { useMyCampaigns } from "@/features/orgPortal/hooks/useMyCampaigns";

const NO_CAMPAIGN = "__none__"; // SelectField cần value là chuỗi → form vẫn lưu null

// Ô nhập dùng chung OB-02 (đăng) và OB-03 (sửa). Màn hình giữ useForm + nút.
// "Gắn với chiến dịch" chỉ liệt kê chiến dịch đang diễn ra; bài đang gắn chiến dịch đã đóng thì vẫn giữ lựa chọn đó
export function PostForm({ control, errors }) {
  const content = useWatch({ control, name: "content" });
  const campaigns = useMyCampaigns();
  const current = useWatch({ control, name: "campaignId" });

  const options = [
    { value: NO_CAMPAIGN, label: "Không gắn chiến dịch" },
    ...(campaigns.data ?? [])
      .filter((c) => c.status === CAMPAIGN_STATUS.OPEN || c.id === current)
      .map((c) => ({
        value: c.id,
        label:
          c.status === CAMPAIGN_STATUS.OPEN ? c.title : `${c.title} (đã đóng)`,
      })),
  ];

  return (
    <View style={styles.wrapper}>
      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <TextField
            label="Nội dung"
            required
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={POST_LIMITS.MAX_CHARS}
            placeholder="Nội dung bài viết…"
            helper={`${(content ?? "").length} / ${POST_LIMITS.MAX_CHARS}`}
            error={errors.content?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="photoUris"
        render={({ field }) => (
          <PhotoPicker
            value={field.value}
            onChange={field.onChange}
            max={POST_LIMITS.MAX_PHOTOS}
            required={false}
            label="Ảnh"
            helper={`Tối đa ${POST_LIMITS.MAX_PHOTOS} ảnh. Ảnh thật về hoạt động giúp người quyên góp tin tưởng hơn.`}
            pickTitle="Thêm ảnh bài viết"
            pickMessage="Chọn ảnh rõ, đủ sáng."
            error={errors.photoUris?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="campaignId"
        render={({ field }) => (
          <View style={styles.group}>
            <SelectField
              label="Gắn với chiến dịch · không bắt buộc"
              options={options}
              value={field.value ?? NO_CAMPAIGN}
              onChange={(v) => field.onChange(v === NO_CAMPAIGN ? null : v)}
              loading={campaigns.isPending}
              placeholder="Không gắn chiến dịch"
              error={errors.campaignId?.message}
            />
            <Text style={styles.helper}>
              Chỉ liệt kê chiến dịch đang diễn ra. Bài gắn chiến dịch hiện nhãn
              riêng trên Cộng đồng.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  group: { gap: spacing.xs },
  helper: { ...textStyles.caption, color: colors.textSecondary },
});
