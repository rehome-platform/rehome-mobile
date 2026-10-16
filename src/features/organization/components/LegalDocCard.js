import { Image, StyleSheet, Text, View } from "react-native";
import { Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { formatFileSize } from "@/features/organization/utils/files";

// Một giấy tờ pháp lý: dòng tệp (ảnh nhỏ / icon PDF, tên, dung lượng, Xoá) + 4 ô thông tin.
// Các ô nằm trong mảng legalDocs của form → tên dạng "legalDocs.0.docType"
export function LegalDocCard({
  index,
  file,
  control,
  errors,
  suggestions,
  onRemove,
}) {
  const isPdf = file.mimeType === "application/pdf";
  const name = (key) => `legalDocs.${index}.${key}`;

  return (
    <View style={styles.card}>
      <View style={styles.fileRow}>
        {isPdf ? (
          <View style={styles.thumb}>
            <Ionicons
              name="document-text-outline"
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
            {isPdf ? "PDF" : "Ảnh"}
            {file.size ? ` · ${formatFileSize(file.size)}` : ""}
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
    </View>
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
});
