import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { Avatar } from "@/components/ui/Avatar";
import {
  ReviewRow,
  ReviewSection,
} from "@/features/organization/components/ReviewSection";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { buildRegisterPayload } from "@/features/organization/utils/payload";
import {
  formatReceivingHours,
  orgTypeLabel,
  pickupAddress,
  scopeLabel,
} from "@/features/organization/utils/summary";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";
import { uploadFile } from "@/lib/api/upload";

const formatDate = (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "");

// Upload mọi tệp song song (logo, 2 mặt CCCD, giấy tờ) → có url → gửi hồ sơ
async function submitApplication(data) {
  const { info, documents } = data;
  const upload = (file) => uploadFile(file).then((res) => res.url);

  const [logo, cccdFront, cccdBack, legalDocs] = await Promise.all([
    info.logoUri
      ? upload({ uri: info.logoUri, name: "logo.jpg", mimeType: "image/jpeg" })
      : null,
    upload(documents.cccdFront),
    upload(documents.cccdBack),
    Promise.all(documents.legalDocs.map((doc) => upload(doc.file))),
  ]);

  const payload = buildRegisterPayload(data, {
    logo,
    cccdFront,
    cccdBack,
    legalDocs,
  });
  return organizationApi.registerOrganization(payload);
}

export default function OrgReviewScreen() {
  const info = useOrgRegisterStore((s) => s.info);
  const representative = useOrgRegisterStore((s) => s.representative);
  const documents = useOrgRegisterStore((s) => s.documents);
  const location = useOrgRegisterStore((s) => s.location);

  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(null);

  const submit = useMutation({
    mutationFn: submitApplication,
    onSuccess: (result) => {
      router.dismissAll(); // bỏ các màn đăng ký khỏi lịch sử → Back không quay lại form đã gửi
      router.replace({
        pathname: "/org-register/submitted",
        params: {
          displayName: result.displayName,
          email: result.contactEmail,
          submittedAt: result.submittedAt,
        },
      });
    },
  });

  if (!info || !representative || !documents || !location) {
    return <Redirect href="/org-register/info" />;
  }

  const onSubmit = () => {
    if (!agreed) return setAgreeError("Bạn cần xác nhận cam đoan để gửi hồ sơ");
    submit.mutate({ info, representative, documents, location });
  };

  // Về đúng bước để sửa (các bước giữa vẫn giữ dữ liệu) → bấm Tiếp tục để quay lại đây
  const edit = (step) => router.dismissTo(`/org-register/${step}`);

  return (
    <Screen
      scroll
      header={<AppHeader title="Xem lại hồ sơ" onBack={() => router.back()} />}
      footer={
        <Button
          title="Gửi hồ sơ"
          onPress={onSubmit}
          loading={submit.isPending}
        />
      }
      contentStyle={styles.content}
    >
      <Text style={styles.desc}>
        Kiểm tra kỹ trước khi gửi. Moderator sẽ phản hồi trong 5 ngày làm việc.
      </Text>

      <ReviewSection title="Tổ chức" onEdit={() => edit("info")}>
        <View style={styles.orgHead}>
          <Avatar
            uri={info.logoUri}
            name={info.displayName}
            size={48}
            initialOf="first"
          />
          <View style={styles.flex}>
            <Text style={styles.orgName}>{info.displayName}</Text>
            <Text style={styles.muted}>{info.legalName}</Text>
          </View>
        </View>
        <ReviewRow label="Loại hình" value={orgTypeLabel(info.orgType)} />
        <ReviewRow label="Mã số thuế" value={info.taxCode} />
        <ReviewRow label="Phạm vi" value={scopeLabel(info.operationScope)} />
        <ReviewRow label="Trụ sở" value={info.address} />
        <ReviewRow label="SĐT liên hệ" value={info.contactPhone} />
        <ReviewRow label="Email đăng nhập" value={info.contactEmail} />
        <ReviewRow label="Website" value={info.website} />
      </ReviewSection>

      <ReviewSection
        title="Người đại diện"
        onEdit={() => edit("representative")}
      >
        <ReviewRow label="Họ và tên" value={representative.fullName} />
        <ReviewRow label="Chức vụ" value={representative.position} />
        <ReviewRow label="Số điện thoại" value={representative.phone} />
        <ReviewRow label="Email" value={representative.email} />
        <ReviewRow label="Mật khẩu" value="Đã đặt" />
      </ReviewSection>

      <ReviewSection title="Giấy tờ" onEdit={() => edit("documents")}>
        <View style={styles.cccdRow}>
          <Image
            source={{ uri: documents.cccdFront.uri }}
            style={styles.cccdImage}
          />
          <Image
            source={{ uri: documents.cccdBack.uri }}
            style={styles.cccdImage}
          />
        </View>
        <ReviewRow label="Họ tên trên thẻ" value={documents.cccdName} />
        <ReviewRow label="Số CCCD" value={documents.cccdNumber} />
        <ReviewRow
          label="Ngày cấp"
          value={formatDate(documents.cccdIssueDate)}
        />
        <ReviewRow label="Nơi cấp" value={documents.cccdIssuePlace} />
        <Text style={styles.subTitle}>
          Giấy tờ pháp lý ({documents.legalDocs.length})
        </Text>
        {documents.legalDocs.map((doc, i) => (
          <View key={i} style={styles.docRow}>
            <Ionicons
              name={
                doc.file.mimeType === "application/pdf"
                  ? "document-text-outline"
                  : "image-outline"
              }
              size={18}
              color={colors.primary}
            />
            <Text style={styles.docText}>{doc.docType}</Text>
          </View>
        ))}
      </ReviewSection>

      <ReviewSection title="Nhận đồ" onEdit={() => edit("location")}>
        <ReviewRow label="Tên điểm nhận" value={location.name} />
        <ReviewRow label="Địa chỉ" value={pickupAddress(info, location)} />
        <ReviewRow label="Thời gian" value={formatReceivingHours(location)} />
        <ReviewRow
          label="Số điện thoại"
          value={location.contactPhone || info.contactPhone}
        />
      </ReviewSection>

      <Checkbox
        checked={agreed}
        onChange={(value) => {
          setAgreed(value);
          setAgreeError(null);
        }}
        error={agreeError}
      >
        Tôi cam đoan thông tin và giấy tờ trên là đúng sự thật, và chịu trách
        nhiệm nếu có sai lệch.
      </Checkbox>

      <ErrorBox message={submit.error?.message}>
        {submit.error?.status === 409 ? (
          <Text style={styles.muted}>
            Bấm "Sửa" ở khối Tổ chức để đổi email hoặc mã số thuế.
          </Text>
        ) : null}
      </ErrorBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  desc: { ...textStyles.body, color: colors.textSecondary },
  flex: { flex: 1 },
  orgHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  orgName: { ...textStyles.heading, color: colors.text },
  muted: { ...textStyles.body, color: colors.textSecondary },
  cccdRow: { flexDirection: "row", gap: spacing.sm },
  cccdImage: { flex: 1, aspectRatio: 1.58, borderRadius: radius.input },
  subTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  docRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  docText: { flex: 1, ...textStyles.body, color: colors.text },
});
