import {
  formatReceivingHours,
  parseReceivingHours,
  pickupAddress,
} from "@/features/organization/utils/summary";
import { fileFromUrl } from "@/features/organization/utils/files";

// F-139 (BE 06fead3): /me không trả URL tệp nữa mà trả link có kiểm quyền "/api/organizations/{id}/legal-files/…".
// Gửi lại link đó khi nộp lại → BE lưu nhầm link làm tệp → bỏ, để tổ chức chụp lại.
// [CHỜ BE] cho nộp lại giữ tệp cũ thì điền sẵn lại như trước
const reusableFile = (url) =>
  url && /^https?:\/\//.test(url) ? fileFromUrl(url) : null;

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

// Ngược lại buildRegisterPayload: hồ sơ bị từ chối (GET /api/organizations/me) → dữ liệu 4 bước để nộp lại.
// BE không trả SĐT / email người đại diện, họ tên / ngày cấp / nơi cấp trên CCCD → để trống, nhập lại
export function registrationFromProfile(p) {
  const rep = p.representative ?? {};
  const hours = parseReceivingHours(p.donationPointReceivingHours);
  const useOfficeAddress =
    !p.donationPointAddress || p.donationPointAddress === p.address;
  return {
    info: {
      legalName: p.legalName ?? "",
      displayName: p.displayName ?? "",
      orgType: p.orgType ?? "",
      taxCode: p.taxCode ?? "",
      operationScope: p.operationScope ?? "",
      address: p.address ?? "",
      contactPhone: p.contactPhone ?? "",
      contactEmail: p.contactEmail ?? "",
      website: p.website ?? "",
      description: p.description ?? "",
      logoUri: p.logoUrl ?? null,
    },
    representative: {
      fullName: rep.fullName ?? "",
      position: rep.position ?? "",
      phone: "",
      email: "",
    },
    documents: {
      cccdFront: reusableFile(rep.cccdFrontUrl),
      cccdBack: reusableFile(rep.cccdBackUrl),
      cccdName: rep.fullName ?? "",
      cccdNumber: rep.cccdNumber ?? "",
      cccdIssueDate: "",
      cccdIssuePlace: "",
      legalDocs: (p.documents ?? [])
        .map((doc) => ({
          file: reusableFile(doc.fileUrl),
          docType: doc.docType ?? "",
          docNumber: doc.docNumber ?? "",
          issueDate: doc.issueDate ?? null,
          issuer: doc.issuingAuthority ?? "",
        }))
        .filter((doc) => doc.file),
    },
    location: {
      useOfficeAddress,
      address: useOfficeAddress ? "" : p.donationPointAddress,
      name: p.donationPointName ?? p.displayName ?? "",
      days: hours?.days ?? [],
      openTime: hours?.openTime ?? "08:00",
      closeTime: hours?.closeTime ?? "17:00",
      contactPhone: p.donationPointContactPhone ?? "",
    },
  };
}
