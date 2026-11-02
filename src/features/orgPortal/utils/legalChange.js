// Yêu cầu đổi pháp lý (OP-04 / OP-05). BE chưa có API đọc lại yêu cầu [CHỜ BE GET] → trạng thái lấy từ
// bản lưu trên máy (legalChangeRecord), riêng "Đã duyệt" suy ra từ hồ sơ GET /me đã mang thông tin mới
export const LEGAL_CHANGE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Hồ sơ đã mang đủ thông tin trong yêu cầu → Moderator đã duyệt (BE áp dụng thẳng vào hồ sơ)
const isApplied = (changes, profile) => {
  const rep = changes.representative;
  return (
    (changes.legalName == null || changes.legalName === profile.legalName) &&
    (changes.orgType == null || changes.orgType === profile.orgType) &&
    (rep == null ||
      (rep.fullName === profile.representative?.fullName &&
        rep.position === profile.representative?.position))
  );
};

// Bản lưu + hồ sơ hiện tại → { ...record, status } (status đã tính lại). Không có bản lưu → null
export function resolveLegalChange(record, profile) {
  if (!record) return null;
  if (
    record.status === LEGAL_CHANGE_STATUS.PENDING &&
    profile &&
    isApplied(record.proposedChanges, profile)
  ) {
    return { ...record, status: LEGAL_CHANGE_STATUS.APPROVED };
  }
  return record;
}

// Dòng nào của khối pháp lý (OP-01) đang nằm trong yêu cầu → { legalName, orgType, representative, documents }
export const changedFields = (changes = {}) => ({
  legalName: changes.legalName != null,
  orgType: changes.orgType != null,
  representative: changes.representative != null,
  documents: !!changes.documents?.length,
});

// Bảng "thông tin đã khai" ở OP-05: [{ label, value }]. orgTypeLabel: mã → tên loại hình (useOrgOptions)
export function changeRows(changes, orgTypeLabel = (v) => v) {
  const rows = [];
  if (changes.legalName != null)
    rows.push({ label: "Tên pháp lý", value: changes.legalName });
  if (changes.orgType != null)
    rows.push({ label: "Loại hình", value: orgTypeLabel(changes.orgType) });
  const rep = changes.representative;
  if (rep)
    rows.push({
      label: "Người đại diện",
      value: [rep.fullName, rep.position].filter(Boolean).join(" · "),
    });
  if (changes.documents?.length)
    rows.push({
      label: "Giấy tờ",
      value: `${changes.documents.length} tệp đã nộp`,
    });
  return rows;
}

// Bị từ chối → "Gửi lại yêu cầu": dựng lại giá trị form OP-04 từ yêu cầu cũ. Tệp là URL trên server
// (toFile = fileFromUrl) → gửi lại không upload lần nữa. Giấy tờ lưu một danh sách: legalNameDocCount
// tệp đầu thuộc mục tên pháp lý, phần còn lại thuộc mục loại hình
export function formFromLegalChange(record, toFile) {
  const c = record.proposedChanges;
  const rep = c.representative;
  const docs = (c.documents ?? []).map((d) => ({
    file: toFile(d.fileUrl),
    docType: d.docType ?? "",
    docNumber: d.docNumber ?? "",
    issueDate: d.issueDate ?? null,
    issuer: d.issuingAuthority ?? "",
  }));
  const split = c.legalName != null ? (record.legalNameDocCount ?? 0) : 0;
  return {
    changeRep: !!rep,
    changeLegalName: c.legalName != null,
    changeOrgType: c.orgType != null,
    rep: {
      fullName: rep?.fullName ?? "",
      position: rep?.position ?? "",
      phone: rep?.phone ?? "",
      email: rep?.email ?? "",
      cccdFront: rep?.cccdFrontUrl ? toFile(rep.cccdFrontUrl) : null,
      cccdBack: rep?.cccdBackUrl ? toFile(rep.cccdBackUrl) : null,
      cccdName: rep?.cccdName ?? "",
      cccdNumber: rep?.cccdNumber ?? "",
      cccdIssueDate: rep?.cccdIssueDate ?? "",
      cccdIssuePlace: rep?.cccdIssuePlace ?? "",
    },
    legalName: c.legalName ?? "",
    legalNameDocs: docs.slice(0, split),
    orgType: c.orgType ?? "",
    orgTypeDocs: docs.slice(split),
  };
}
