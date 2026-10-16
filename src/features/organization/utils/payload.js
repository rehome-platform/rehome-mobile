import {
  formatReceivingHours,
  pickupAddress,
} from "@/features/organization/utils/summary";

// Ghép dữ liệu 4 bước + url tệp đã upload → body gửi BE (RegisterOrganizationRequest).
// Trường ghi [GIẢ ĐỊNH]: BE chưa nhận — đã có trong danh sách gửi BE
export function buildRegisterPayload(
  { info, representative, documents, location },
  urls,
) {
  return {
    legalName: info.legalName,
    displayName: info.displayName,
    orgType: info.orgType,
    taxCode: info.taxCode || null,
    operationScope: info.operationScope,
    address: info.address,
    contactPhone: info.contactPhone,
    contactEmail: info.contactEmail,
    website: info.website || null,
    description: info.description,
    logoUrl: urls.logo,
    password: representative.password, // [GIẢ ĐỊNH]
    representative: {
      fullName: representative.fullName,
      position: representative.position,
      phone: representative.phone, // [GIẢ ĐỊNH]
      email: representative.email, // [GIẢ ĐỊNH]
      cccdNumber: documents.cccdNumber,
      cccdName: documents.cccdName, // [GIẢ ĐỊNH]
      cccdIssueDate: documents.cccdIssueDate, // [GIẢ ĐỊNH]
      cccdIssuePlace: documents.cccdIssuePlace, // [GIẢ ĐỊNH]
      cccdFrontUrl: urls.cccdFront,
      cccdBackUrl: urls.cccdBack,
    },
    documents: documents.legalDocs.map((doc, i) => ({
      docType: doc.docType,
      docNumber: doc.docNumber || null,
      issueDate: doc.issueDate,
      issuingAuthority: doc.issuer || null, // BE đặt tên là issuingAuthority
      fileUrl: urls.legalDocs[i],
    })),
    donationPoint: {
      name: location.name,
      address: pickupAddress(info, location),
      latitude: null, // [GIẢ ĐỊNH] bản đồ ghim làm sau — BE đang bắt buộc
      longitude: null,
      receivingHours: formatReceivingHours(location),
      contactPhone: location.contactPhone || info.contactPhone,
    },
  };
}
