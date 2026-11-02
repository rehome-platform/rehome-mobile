import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DateField } from "@/components/ui/DateField";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { RadioCard } from "@/components/ui/RadioCard";
import { TextField } from "@/components/ui/TextField";
import { showToast } from "@/utils/toast";
import { useAuthStore } from "@/stores/authStore";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { uploadFile } from "@/lib/api/upload";
import {
  DEFAULT_DOC_SUGGESTIONS,
  DOC_SUGGESTIONS,
  FILE_RULES,
} from "@/features/organization/constants";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { makeLegalChangeSchema } from "@/features/organization/schemas";
import {
  orgKeys,
  useMyOrganization,
} from "@/features/organization/hooks/useMyOrganization";
import { useOrgOptions } from "@/features/organization/hooks/useOrgOptions";
import { optionLabel } from "@/features/organization/utils/summary";
import {
  pickDocument,
  pickImage,
  takePhoto,
} from "@/features/organization/utils/files";
import { CccdSlot } from "@/features/organization/components/CccdSlot";
import { LegalDocCard } from "@/features/organization/components/LegalDocCard";
import { saveLegalChangeRecord } from "@/features/orgPortal/utils/legalChangeRecord";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/org/profile");

const EMPTY = {
  changeRep: false,
  changeLegalName: false,
  changeOrgType: false,
  rep: {
    fullName: "",
    position: "",
    phone: "",
    email: "",
    cccdFront: null,
    cccdBack: null,
    cccdName: "",
    cccdNumber: "",
    cccdIssueDate: "",
    cccdIssuePlace: "",
  },
  legalName: "",
  legalNameDocs: [],
  orgType: "",
  orgTypeDocs: [],
};
const newDoc = (file) => ({
  file,
  docType: "",
  docNumber: "",
  issueDate: null,
  issuer: "",
});

// Chạy một hàm chọn tệp; lỗi (sai định dạng, quá dung lượng, thiếu quyền) → Alert
async function runPicker(picker, onPicked) {
  try {
    const file = await picker();
    if (file) onPicked(file);
  } catch (e) {
    Alert.alert("Không thêm được tệp", e.message);
  }
}

// Upload mọi tệp (CCCD, giấy tờ) → proposedChanges gửi BE (hình dạng đã gửi BE xác nhận). Mục không tích bỏ qua
async function submitChange(values) {
  const upload = (file) =>
    uploadFile(file, UPLOAD_FOLDER.ORGANIZATION_DOCUMENTS).then((r) => r.url);
  const docs = [
    ...(values.changeLegalName ? values.legalNameDocs : []),
    ...(values.changeOrgType ? values.orgTypeDocs : []),
  ];
  const [front, back, docUrls] = await Promise.all([
    values.changeRep ? upload(values.rep.cccdFront) : null,
    values.changeRep ? upload(values.rep.cccdBack) : null,
    Promise.all(docs.map((d) => upload(d.file))),
  ]);
  const r = values.rep;
  const proposedChanges = {
    ...(values.changeLegalName ? { legalName: values.legalName } : {}),
    ...(values.changeOrgType ? { orgType: values.orgType } : {}),
    ...(values.changeRep
      ? {
          representative: {
            fullName: r.fullName,
            position: r.position,
            phone: r.phone,
            email: r.email,
            cccdNumber: r.cccdNumber,
            cccdName: r.cccdName,
            cccdIssueDate: r.cccdIssueDate,
            cccdIssuePlace: r.cccdIssuePlace,
            cccdFrontUrl: front,
            cccdBackUrl: back,
          },
        }
      : {}),
    ...(docs.length
      ? {
          documents: docs.map((d, i) => ({
            docType: d.docType,
            docNumber: d.docNumber || null,
            issueDate: d.issueDate,
            issuingAuthority: d.issuer || null,
            fileUrl: docUrls[i],
          })),
        }
      : {}),
  };
  const res = await organizationApi.requestLegalChange(proposedChanges);
  return { res, proposedChanges };
}

function SectionHead({ index, title, current }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>
        {index} · {title}
      </Text>
      {current ? <Text style={styles.muted}>Hiện tại: {current}</Text> : null}
    </View>
  );
}

// Danh sách giấy tờ của một mục (tên pháp lý mới / loại hình mới) + nút Chụp giấy tờ / Chọn tệp
function DocList({ name, control, errors, suggestions }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const full = fields.length >= FILE_RULES.maxLegalDocs;
  const add = (picker) => runPicker(picker, (file) => append(newDoc(file)));
  const listError = errors[name]?.message ?? errors[name]?.root?.message;
  return (
    <View style={styles.group}>
      {fields.map((f, i) => (
        <LegalDocCard
          key={f.id}
          index={i}
          fieldName={name}
          file={f.file}
          control={control}
          errors={errors[name]?.[i]}
          suggestions={suggestions.map((s) => ({ value: s, label: s }))}
          onRemove={() => remove(i)}
        />
      ))}
      {!full ? (
        <View style={styles.row}>
          <Button
            title="Chụp giấy tờ"
            onPress={() => add(takePhoto)}
            style={styles.flex}
          />
          <Button
            title="Chọn tệp"
            variant="secondary"
            onPress={() =>
              Alert.alert("Thêm giấy tờ", "Ảnh hoặc PDF, tối đa 5 MB.", [
                { text: "Huỷ", style: "cancel" },
                { text: "Ảnh trong máy", onPress: () => add(pickImage) },
                { text: "Tệp PDF", onPress: () => add(pickDocument) },
              ])
            }
            style={styles.flex}
          />
        </View>
      ) : null}
      {listError ? <Text style={styles.error}>{listError}</Text> : null}
    </View>
  );
}

function LegalChangeForm({ profile }) {
  const owner = useAuthStore((s) => s.user?.email);
  const queryClient = useQueryClient();
  const options = useOrgOptions();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(makeLegalChangeSchema(profile)),
    defaultValues: EMPTY,
  });
  const [changeRep, changeLegalName, changeOrgType, orgType, orgTypeDocs, rep] =
    useWatch({
      control,
      name: [
        "changeRep",
        "changeLegalName",
        "changeOrgType",
        "orgType",
        "orgTypeDocs",
        "rep",
      ],
    });

  const send = useMutation({
    mutationFn: submitChange,
    onSuccess: async ({ res, proposedChanges }) => {
      // Lưu trên máy hỏng thì yêu cầu vẫn đã gửi → không báo lỗi
      await saveLegalChangeRecord(owner, {
        id: res?.id ?? null,
        status: res?.status ?? "PENDING",
        proposedChanges,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: orgKeys.me });
      showToast("Đã gửi yêu cầu, chờ Moderator duyệt");
      leave(); // [TẠM] bước sau chuyển sang OP-05 Trạng thái yêu cầu
    },
  });

  const onSubmit = handleSubmit((values) =>
    Alert.alert(
      "Gửi yêu cầu đổi pháp lý?",
      "Hồ sơ công khai giữ thông tin cũ cho tới khi Moderator duyệt. Mỗi lần chỉ gửi được một yêu cầu.",
      [
        { text: "Xem lại", style: "cancel" },
        { text: "Gửi", onPress: () => send.mutate(values) },
      ],
    ),
  );

  const onBack = () => {
    if (!isDirty) return leave();
    Alert.alert("Bỏ yêu cầu đang soạn?", "Những gì bạn vừa nhập sẽ mất.", [
      { text: "Soạn tiếp", style: "cancel" },
      { text: "Bỏ", style: "destructive", onPress: leave },
    ]);
  };

  const pickCccd = (key, label) =>
    Alert.alert(`Ảnh CCCD ${label}`, "Chụp rõ đủ 4 góc thẻ, không lóa.", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Chọn từ thư viện",
        onPress: () =>
          runPicker(pickImage, (f) =>
            setValue(`rep.${key}`, f, {
              shouldDirty: true,
              shouldValidate: true,
            }),
          ),
      },
      {
        text: "Chụp ảnh",
        onPress: () =>
          runPicker(takePhoto, (f) =>
            setValue(`rep.${key}`, f, {
              shouldDirty: true,
              shouldValidate: true,
            }),
          ),
      },
    ]);

  const repErr = errors.rep ?? {};
  const field = (name, props) => (
    <Controller
      control={control}
      name={`rep.${name}`}
      render={({ field: f }) => (
        <TextField
          required
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={repErr[name]?.message}
          {...props}
        />
      )}
    />
  );

  const typeSuggestions =
    (orgType && DOC_SUGGESTIONS[orgType]) ?? DEFAULT_DOC_SUGGESTIONS;
  const missingDocs = Math.max(
    0,
    typeSuggestions.length - (orgTypeDocs?.length ?? 0),
  );
  const currentRep = profile.representative
    ? [profile.representative.fullName, profile.representative.position]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Screen
      scroll
      header={<AppHeader title="Đổi thông tin pháp lý" onBack={onBack} />}
      footer={
        <Button
          title="Gửi yêu cầu duyệt"
          onPress={onSubmit}
          loading={send.isPending}
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.infoBox}>
        <Text style={styles.text}>
          Gửi xong, hồ sơ công khai{" "}
          <Text style={styles.bold}>giữ nguyên thông tin cũ</Text> cho tới khi
          Moderator duyệt. Chiến dịch và bài viết vẫn chạy bình thường.
        </Text>
      </View>

      {send.isError ? <ErrorBox message={send.error.message} /> : null}

      <View style={styles.group}>
        <Text style={styles.label}>CHỌN THÔNG TIN MUỐN ĐỔI</Text>
        <View style={styles.checkBox}>
          {[
            ["changeRep", "Người đại diện theo pháp luật"],
            ["changeLegalName", "Tên pháp lý của tổ chức"],
            ["changeOrgType", "Loại hình tổ chức"],
          ].map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field: f }) => (
                <Checkbox checked={f.value} onChange={f.onChange}>
                  {label}
                </Checkbox>
              )}
            />
          ))}
        </View>
        {errors.changeRep?.message ? (
          <Text style={styles.error}>{errors.changeRep.message}</Text>
        ) : (
          <Text style={styles.helper}>
            Tích mục nào thì form của mục đó hiện ra bên dưới. Khai lại đầy đủ
            như lúc đăng ký, không sửa từng phần.
          </Text>
        )}
      </View>

      {changeRep ? (
        <View style={styles.section}>
          <SectionHead
            index={1}
            title="Người đại diện mới"
            current={currentRep}
          />
          {field("fullName", { label: "Họ và tên", autoCapitalize: "words" })}
          {field("position", { label: "Chức vụ" })}
          {field("phone", {
            label: "Số điện thoại",
            keyboardType: "phone-pad",
            maxLength: 12,
          })}
          {field("email", {
            label: "Email",
            keyboardType: "email-address",
            autoCapitalize: "none",
          })}
          <Text style={styles.label}>CCCD NGƯỜI ĐẠI DIỆN MỚI *</Text>
          <View style={styles.row}>
            <CccdSlot
              label="Mặt trước"
              file={rep.cccdFront}
              error={!!repErr.cccdFront}
              onPress={() => pickCccd("cccdFront", "mặt trước")}
              onRemove={() =>
                setValue("rep.cccdFront", null, { shouldDirty: true })
              }
            />
            <CccdSlot
              label="Mặt sau"
              file={rep.cccdBack}
              error={!!repErr.cccdBack}
              onPress={() => pickCccd("cccdBack", "mặt sau")}
              onRemove={() =>
                setValue("rep.cccdBack", null, { shouldDirty: true })
              }
            />
          </View>
          {repErr.cccdFront || repErr.cccdBack ? (
            <Text style={styles.error}>
              {repErr.cccdFront?.message ?? repErr.cccdBack?.message}
            </Text>
          ) : null}
          {field("cccdName", {
            label: "Họ tên trên thẻ",
            autoCapitalize: "characters",
          })}
          {field("cccdNumber", {
            label: "Số CCCD",
            keyboardType: "number-pad",
            maxLength: 12,
          })}
          <Controller
            control={control}
            name="rep.cccdIssueDate"
            render={({ field: f }) => (
              <DateField
                label="Ngày cấp"
                required
                value={f.value}
                onChange={f.onChange}
                error={repErr.cccdIssueDate?.message}
              />
            )}
          />
          {field("cccdIssuePlace", { label: "Nơi cấp" })}
        </View>
      ) : null}

      {changeLegalName ? (
        <View style={styles.section}>
          <SectionHead
            index={changeRep ? 2 : 1}
            title="Tên pháp lý mới"
            current={profile.legalName}
          />
          <Controller
            control={control}
            name="legalName"
            render={({ field: f }) => (
              <TextField
                label="Tên đầy đủ theo giấy tờ"
                required
                value={f.value}
                onChangeText={f.onChange}
                onBlur={f.onBlur}
                error={errors.legalName?.message}
              />
            )}
          />
          <Text style={styles.label}>GIẤY TỜ PHÁP LÝ MỚI *</Text>
          <DocList
            name="legalNameDocs"
            control={control}
            errors={errors}
            suggestions={[
              "Quyết định sửa đổi giấy phép thành lập",
              "Quyết định đổi tên tổ chức",
            ]}
          />
        </View>
      ) : null}

      {changeOrgType ? (
        <View style={styles.section}>
          <SectionHead
            index={[changeRep, changeLegalName].filter(Boolean).length + 1}
            title="Loại hình tổ chức mới"
            current={optionLabel(options.data?.orgTypes, profile.orgType)}
          />
          {options.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Controller
              control={control}
              name="orgType"
              render={({ field: f }) => (
                <View style={styles.group}>
                  {(options.data?.orgTypes ?? [])
                    .filter((t) => t.value !== profile.orgType)
                    .map((t) => (
                      <RadioCard
                        key={t.value}
                        title={t.label}
                        selected={f.value === t.value}
                        onPress={() => f.onChange(t.value)}
                        style={styles.radio}
                      />
                    ))}
                  {errors.orgType ? (
                    <Text style={styles.error}>{errors.orgType.message}</Text>
                  ) : null}
                </View>
              )}
            />
          )}
          {orgType ? (
            <View style={styles.infoBox}>
              <Text style={styles.bold}>
                Đổi loại hình thì phải nộp lại bộ giấy tờ của loại hình mới
              </Text>
              <Text style={styles.text}>
                {optionLabel(options.data?.orgTypes, orgType)} cần:
              </Text>
              {typeSuggestions.map((s) => (
                <Text key={s} style={styles.text}>
                  • {s}
                </Text>
              ))}
            </View>
          ) : null}
          <DocList
            name="orgTypeDocs"
            control={control}
            errors={errors}
            suggestions={typeSuggestions}
          />
          {orgType && missingDocs > 0 ? (
            <Text style={styles.helper}>
              Còn thiếu {missingDocs} giấy tờ theo danh sách trên. Thiếu vẫn gửi
              được — Moderator xem và đối chiếu, như lúc đăng ký.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.dashed}>
        <Text style={styles.text}>
          Mỗi lần chỉ gửi được <Text style={styles.bold}>một yêu cầu</Text>.
          Đang chờ duyệt thì không tạo yêu cầu mới.
        </Text>
        <Text style={styles.text}>
          Moderator xem yêu cầu này bằng đúng checklist lúc đăng ký, nên khai
          thiếu là bị trả lại.
        </Text>
      </View>
    </Screen>
  );
}

// OP-04 · Đổi thông tin pháp lý: tích mục muốn đổi (người đại diện / tên pháp lý / loại hình) → khai đủ mục đó
// → POST /me/legal-change-requests (chờ Moderator duyệt). Form dựng khi đã có hồ sơ (để so với thông tin hiện tại)
export default function OrgLegalChangeScreen() {
  const me = useMyOrganization();
  if (me.data) return <LegalChangeForm profile={me.data} />;
  return (
    <Screen header={<AppHeader title="Đổi thông tin pháp lý" onBack={leave} />}>
      {me.isError ? (
        <ErrorBox message={me.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => me.refetch()}
          />
        </ErrorBox>
      ) : (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  content: { gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md },
  group: { gap: spacing.sm },
  section: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  sectionHead: { gap: 2 },
  sectionTitle: { ...textStyles.heading, color: colors.text },
  label: { ...textStyles.label, color: colors.textSecondary },
  text: { ...textStyles.body, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
  radio: { flex: 0 },
  infoBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  checkBox: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  dashed: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
  },
});
