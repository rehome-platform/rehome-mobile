import { useQuery } from "@tanstack/react-query";
import { organizationApi } from "../api/organizationApi";

export const ORG_STATUS = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  VERIFIED: "VERIFIED",
};
export const orgKeys = { me: ["organization", "me"] };

// Trạng thái hồ sơ tổ chức: null (chưa nộp) | PENDING | REJECTED (+ rejectionReason) | VERIFIED
export const useMyOrganization = () =>
  useQuery({
    queryKey: orgKeys.me,
    queryFn: organizationApi.getMyOrganization,
  });
