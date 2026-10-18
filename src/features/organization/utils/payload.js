import {
  formatReceivingHours,
  pickupAddress,
} from "@/features/organization/utils/summary";

// Ghép dữ liệu 4 bước + url tệp đã upload + toạ độ điểm nhận → body RegisterOrganizationRequest (BE 2af9d85).
// Trường [GIẢ ĐỊNH]: BE chưa lưu (gửi lên bị bỏ qua) — đã có trong danh sách gửi BE
export function buildRegisterPayload(
  { info, representative, documents, location },
  urls,
  coords,
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
      latitude: coords.latitude, // BE bắt buộc — lấy từ địa chỉ (utils/geocode.js)
      longitude: coords.longitude,
      receivingHours: formatReceivingHours(location),
      contactPhone: location.contactPhone || info.contactPhone,
    },
  };
}
