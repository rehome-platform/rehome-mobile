import { StyleSheet, Text, View } from "react-native";
import { Controller, useWatch } from "react-hook-form";
import dayjs from "dayjs";
import { colors, spacing, textStyles } from "@/theme";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { CAMPAIGN_LIMITS } from "@/constants/donation";
import { CoverPicker } from "@/features/orgPortal/components/CoverPicker";
import { ItemTypePicker } from "@/features/orgPortal/components/ItemTypePicker";
import { ReceivingPlaceField } from "@/features/orgPortal/components/ReceivingPlaceField";

// Ô nhập dùng chung OC-02 (tạo) và OC-04 (sửa) — như ConsignFormFields. Màn hình giữ useForm + nút.
// startLocked: chiến dịch đang chạy → khoá ngày bắt đầu (B4). lockedWarehouseIds: kho còn đơn chờ lấy.
// ownAddress / ownHours: điểm nhận đồ trong hồ sơ tổ chức (thẻ "Nhận tại địa chỉ riêng")
export function CampaignForm({
  control,
  errors,
  startLocked = false,
  lockedWarehouseIds = [],
  ownAddress,
  ownHours,
}) {
  const [startDate, description] = useWatch({
    control,
    name: ["startDate", "description"],
  });
  const today = dayjs().startOf("day");
  // Ngày kết thúc: sau ngày bắt đầu và không ở quá khứ (chiến dịch đang chạy có ngày bắt đầu đã qua)
  const afterStart = (startDate ? dayjs(startDate) : today).add(1, "day");
  const endMin = afterStart.isAfter(today) ? afterStart : today;

  return (
    <View style={styles.wrapper}>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label="Tên chiến dịch"
            required
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={CAMPAIGN_LIMITS.TITLE_MAX}
            placeholder="Vd: Áo ấm cho trẻ vùng cao mùa đông 2026"
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="coverUri"
        render={({ field }) => (
          <CoverPicker value={field.value} onChange={field.onChange} />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Mô tả"
            required
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={CAMPAIGN_LIMITS.DESCRIPTION_MAX}
            placeholder="Vì sao cần, ai sẽ nhận, đồ cần như thế nào…"
            helper={`${(description ?? "").length} / ${CAMPAIGN_LIMITS.DESCRIPTION_MAX}`}
            error={errors.description?.message}
          />
        )}
      />

      <View style={styles.group}>
        <Text style={styles.label}>
          Nhận đồ từ ngày — đến ngày<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.dateRow}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DateField
                style={styles.dateField}
                value={field.value}
                onChange={field.onChange}
                placeholder="Từ ngày"
                minimumDate={today.toDate()}
                maximumDate={null}
                disabled={startLocked}
                error={errors.startDate?.message}
              />
            )}
          />
          <Text style={styles.arrow}>→</Text>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DateField
                style={styles.dateField}
                value={field.value}
                onChange={field.onChange}
                placeholder="Đến ngày"
                minimumDate={endMin.toDate()}
                maximumDate={null}
                error={errors.endDate?.message}
              />
            )}
          />
        </View>
        <Text style={styles.helper}>
          {startLocked
            ? "Ngày bắt đầu đã khoá (chiến dịch đang chạy) — chỉ dời được ngày kết thúc."
            : "Hết ngày cuối, chiến dịch tự đóng — không cần bạn làm gì."}
        </Text>
      </View>

      <Controller
        control={control}
        name="preferredItemTypes"
        render={({ field }) => (
          <ItemTypePicker
            value={field.value}
            onChange={field.onChange}
            error={errors.preferredItemTypes?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="receiveAtOwnAddress"
        render={({ field: own }) => (
          <Controller
            control={control}
            name="warehouseIds"
            render={({ field: wh }) => (
              <ReceivingPlaceField
                receiveAtOwnAddress={own.value}
                warehouseIds={wh.value}
                onChangeOwnAddress={own.onChange}
                onChangeWarehouseIds={wh.onChange}
                ownAddress={ownAddress}
                ownHours={ownHours}
                lockedIds={lockedWarehouseIds}
                error={errors.receiveAtOwnAddress?.message}
              />
            )}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  group: { gap: spacing.xs },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  required: { color: colors.error },
  dateRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  dateField: { flex: 1 },
  arrow: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  helper: { ...textStyles.caption, color: colors.textSecondary },
});
