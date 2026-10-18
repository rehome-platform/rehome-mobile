import { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { NoteBox } from "@/components/ui/NoteBox";
import { OrgRegisterHeader } from "@/features/organization/components/OrgRegisterHeader";
import { CccdSlot } from "@/features/organization/components/CccdSlot";
import { LegalDocCard } from "@/features/organization/components/LegalDocCard";
import { FILE_RULES, ORG_TYPES } from "@/features/organization/constants";
import { orgDocumentsSchema } from "@/features/organization/schemas";
import {
  pickDocument,
  pickImage,
  takePhoto,
} from "@/features/organization/utils/files";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

const emptyDocuments = (representative) => ({
  cccdFront: null,
  cccdBack: null,
  cccdName: representative?.fullName ?? "", // điền sẵn tên người đại diện — thường trùng
  cccdNumber: "",
  cccdIssueDate: "",
  cccdIssuePlace: "",
  legalDocs: [],
});

// Chạy một hàm chọn tệp; lỗi (sai định dạng, quá 5 MB, thiếu quyền) → báo bằng Alert
async function runPicker(picker, onPicked) {
  try {
    const file = await picker();
    if (file) onPicked(file);
  } catch (e) {
    Alert.alert("Không thêm được tệp", e.message);
  }
}

export default function OrgDocumentsScreen() {
  const info = useOrgRegisterStore((s) => s.info);
  const representative = useOrgRegisterStore((s) => s.representative);
  const saved = useOrgRegisterStore((s) => s.documents);
  const saveStep = useOrgRegisterStore((s) => s.saveStep);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orgDocumentsSchema),
    defaultValues: saved ?? emptyDocuments(representative),
  });
  // Danh sách giấy tờ pháp lý: thêm / xoá phần tử, mỗi phần tử có ô riêng
  const { fields, append, remove } = useFieldArray({
    control,
    name: "legalDocs",
  });
  const cccdFront = watch("cccdFront");
  const cccdBack = watch("cccdBack");

  // Tự lưu nháp (giống bước 2)
  useEffect(() => {
    const sub = watch((values) => saveStep("documents", { ...values }));
    return () => sub.unsubscribe();
  }, [watch, saveStep]);

  if (!info || !representative)
    return <Redirect href="/org/registration/info" />;

  const orgType = ORG_TYPES.find((t) => t.value === info.orgType);
  const suggestions = (orgType?.suggestedDocs ?? []).map((d) => ({
    value: d,
    label: d,
  }));

  // shouldValidate: chọn ảnh xong thì lỗi "Vui lòng thêm ảnh…" (nếu có) biến mất ngay
  const setCccd = (name) => (file) =>
    setValue(name, file, { shouldValidate: true, shouldDirty: true });

  const chooseCccd = (name, label) =>
    Alert.alert(
      `Ảnh CCCD ${label.toLowerCase()}`,
      "Chụp rõ đủ 4 góc thẻ, không lóa, không che thông tin.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Chọn từ thư viện",
          onPress: () => runPicker(pickImage, setCccd(name)),
        },
        {
          text: "Chụp ảnh",
          onPress: () => runPicker(takePhoto, setCccd(name)),
        },
      ],
    );

  const isFull = fields.length >= FILE_RULES.maxLegalDocs;
  const addLegalDoc = (picker) =>
    runPicker(picker, (file) =>
      append({ file, docType: "", docNumber: "", issueDate: null, issuer: "" }),
    );

  const onSubmit = handleSubmit((values) => {
    saveStep("documents", values);
    router.push("/org/registration/location");
  });

  const cccdImageError = errors.cccdFront?.message ?? errors.cccdBack?.message;
  const legalDocsError =
    errors.legalDocs?.message ?? errors.legalDocs?.root?.message;

  return (
    <Screen
      scroll
      header={<OrgRegisterHeader step={2} />}
      footer={<Button title="Tiếp tục — Nhận đồ" onPress={onSubmit} />}
      contentStyle={styles.content}
    >
      {/* ---- 1. CCCD người đại diện ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CCCD của người đại diện</Text>
        <Text style={styles.desc}>
          Chụp đủ 2 mặt. Thông tin trên thẻ phải khớp với người đại diện ở bước
          2.
        </Text>
      </View>

      <View style={styles.group}>
        <View style={styles.slots}>
          <CccdSlot
            label="Mặt trước"
            file={cccdFront}
            error={!!errors.cccdFront}
            onPress={() => chooseCccd("cccdFront", "Mặt trước")}
            onRemove={() => setValue("cccdFront", null, { shouldDirty: true })}
          />
          <CccdSlot
            label="Mặt sau"
            file={cccdBack}
            error={!!errors.cccdBack}
            onPress={() => chooseCccd("cccdBack", "Mặt sau")}
            onRemove={() => setValue("cccdBack", null, { shouldDirty: true })}
          />
        </View>
        {cccdImageError ? (
          <Text style={styles.error}>{cccdImageError}</Text>
        ) : null}
      </View>

      <Controller
        control={control}
        name="cccdName"
        render={({ field }) => (
          <TextField
            label="Họ tên trên thẻ"
            required
            autoCapitalize="characters"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.cccdName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="cccdNumber"
        render={({ field }) => (
          <TextField
            label="Số CCCD"
            required
            keyboardType="number-pad"
            maxLength={12}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.cccdNumber?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="cccdIssueDate"
        render={({ field }) => (
          <DateField
            label="Ngày cấp"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.cccdIssueDate?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="cccdIssuePlace"
        render={({ field }) => (
          <TextField
            label="Nơi cấp"
            required
            placeholder="Cục Cảnh sát QLHC về TTXH"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.cccdIssuePlace?.message}
          />
        )}
      />

      <NoteBox>
        Ảnh CCCD chỉ dùng để xác minh và tự động xoá sau khi hồ sơ được duyệt.
      </NoteBox>

      {/* ---- 2. Giấy tờ pháp lý ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giấy tờ pháp lý</Text>
        <Text style={styles.desc}>
          Giấy tờ chứng minh tổ chức được thành lập hợp pháp. Cần ít nhất 1 tệp.
        </Text>
      </View>

      {suggestions.length ? (
        <NoteBox>
          <Text style={styles.noteTitle}>Gợi ý cho "{orgType.label}":</Text>
          {suggestions.map((s) => (
            <Text key={s.value} style={styles.noteText}>
              • {s.label}
            </Text>
          ))}
          <Text style={styles.noteText}>
            Giấy tờ khác có giá trị tương đương cũng được.
          </Text>
        </NoteBox>
      ) : null}

      {fields.map((item, index) => (
        <LegalDocCard
          key={item.id}
          index={index}
          file={item.file}
          control={control}
          errors={errors.legalDocs?.[index]}
          suggestions={suggestions}
          onRemove={() => remove(index)}
        />
      ))}

      <View style={styles.group}>
        {legalDocsError ? (
          <Text style={styles.error}>{legalDocsError}</Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            title="Chụp giấy tờ"
            variant="secondary"
            disabled={isFull}
            onPress={() => addLegalDoc(takePhoto)}
            style={styles.action}
          />
          <Button
            title="Chọn tệp"
            variant="secondary"
            disabled={isFull}
            onPress={() => addLegalDoc(pickDocument)}
            style={styles.action}
          />
        </View>
        <Text style={styles.helper}>
          JPG, PNG hoặc PDF · tối đa {FILE_RULES.maxSizeMB} MB/tệp · đã thêm{" "}
          {fields.length}/{FILE_RULES.maxLegalDocs}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  section: { gap: spacing.xs },
  sectionTitle: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  group: { gap: spacing.sm },
  slots: { flexDirection: "row", gap: spacing.md },
  noteTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
