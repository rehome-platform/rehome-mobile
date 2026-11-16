import { Image, StyleSheet, Text, View } from "react-native";
import { Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { ChipGroup } from "@/components/ui/ChipGroup";
import {
  formatFileSize,
  isProtectedFile,
} from "@/features/organization/utils/files";

// Một giấy tờ pháp lý: dòng tệp (ảnh nhỏ / icon PDF, tên, dung lượng, Xoá) + 4 ô thông tin.
// Các ô nằm trong mảng fieldName của form (mặc định legalDocs) → tên dạng "legalDocs.0.docType".
// OP-04 có 2 danh sách giấy tờ riêng (tên pháp lý mới, loại hình mới) → truyền fieldName khác
// file = null: giấy tờ bị Moderator chấm "Chưa đạt" lúc nộp lại (OA-06) → khung đỏ + nút chụp / chọn tệp mới (onPickFile)
export function LegalDocCard({
  index,
  file,
  control,
  errors,
  suggestions,
  onRemove,
  onPickFile,
  fieldName = "legalDocs",
}) {
  const name = (key) => `${fieldName}.${index}.${key}`;

  if (!file) {
    return (
      <View style={[styles.card, styles.cardRejected]}>
        <View style={styles.fileRow}>
          <View style={[styles.thumb, styles.thumbRejected]}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={colors.error}
            />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.rejectedTitle}>Chưa đạt — cần nộp lại</Text>
            <Text style={styles.fileMeta}>
              Moderator chưa chấp nhận tệp cũ. Thêm bản rõ, đúng giấy tờ.
            </Text>
          </View>
          <Text
            style={styles.remove}
            onPress={onRemove}
            accessibilityRole="button"
          >
            Xoá
          </Text>
        </View>
        {onPickFile ? (
          <View style={styles.pickRow}>
            <Text
              style={styles.pick}
              onPress={() => onPickFile("camera")}
              accessibilityRole="button"
            >
              Chụp lại
            </Text>
            <Text
              style={styles.pick}
              onPress={() => onPickFile("file")}
              accessibilityRole="button"
            >
              Chọn tệp
            </Text>
          </View>
        ) : null}
        {errors?.file?.message ? (
          <Text style={styles.error}>{errors.file.message}</Text>
        ) : null}
        <DocFields
          name={name}
          control={control}
          errors={errors}
          suggestions={suggestions}
        />
      </View>
    );
  }

  const isPdf = file.mimeType === "application/pdf";
  const submitted = isProtectedFile(file.uri); // giấy tờ đã nộp (F-139): không xem trước được

  return (
    <View style={styles.card}>
      <View style={styles.fileRow}>
        {isPdf || submitted ? (
          <View style={styles.thumb}>
            <Ionicons
              name={
                submitted ? "checkmark-circle-outline" : "document-text-outline"
              }
              size={24}
              color={colors.primary}
            />
          </View>
        ) : (
          <Image source={{ uri: file.uri }} style={styles.thumb} />
        )}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.fileMeta}>
            {submitted
              ? "Giữ tệp cũ khi gửi lại"
              : `${isPdf ? "PDF" : "Ảnh"}${file.size ? ` · ${formatFileSize(file.size)}` : ""}`}
          </Text>
        </View>
        <Text
          style={styles.remove}
          onPress={onRemove}
          accessibilityRole="button"
        >
          Xoá
        </Text>
      </View>

      <DocFields
        name={name}
        control={control}
        errors={errors}
        suggestions={suggestions}
      />
    </View>
  );
}

// 4 ô thông tin của một giấy tờ (dùng chung cho thẻ có tệp và thẻ "cần nộp lại")
function DocFields({ name, control, errors, suggestions }) {
  return (
    <>
      <Controller
        control={control}
        name={name("docType")}
        render={({ field }) => (
          <View style={styles.group}>
            <TextField
              label="Loại giấy tờ"
              required
              placeholder="Chọn gợi ý bên dưới hoặc tự nhập"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors?.docType?.message}
            />
            {suggestions.length ? (
              <ChipGroup
                options={suggestions}
                value={field.value}
                onChange={field.onChange}
              />
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name={name("docNumber")}
        render={({ field }) => (
          <TextField
            label="Số hiệu giấy tờ"
            placeholder="VD: 123/QĐ-UBND"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name={name("issueDate")}
        render={({ field }) => (
          <DateField
            label="Ngày cấp"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name={name("issuer")}
        render={({ field }) => (
          <TextField
            label="Cơ quan cấp"
            placeholder="VD: UBND TP. Hồ Chí Minh"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  fileRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  fileInfo: { flex: 1 },
  fileName: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  fileMeta: { ...textStyles.caption, color: colors.textSecondary },
  remove: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  group: { gap: spacing.sm },
  cardRejected: { borderColor: colors.error },
  thumbRejected: { backgroundColor: tones.danger.bg },
  rejectedTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.error,
  },
  pickRow: { flexDirection: "row", gap: spacing.lg },
  pick: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
