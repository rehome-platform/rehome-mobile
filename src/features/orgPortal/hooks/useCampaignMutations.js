import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgContentApi } from "@/features/orgPortal/api/orgContentApi";
import { formToCampaignBody } from "@/features/orgPortal/utils/campaignRules";

// Ảnh bìa: ảnh mới trong máy → upload; URL cũ (đang sửa) → giữ nguyên; không có → null
const isRemote = (uri) => /^https?:\/\//.test(uri);
const coverUrlOf = async (uri) =>
  !uri ? null : isRemote(uri) ? uri : orgContentApi.uploadCover(uri);

// Ghi xong → làm mới mọi dữ liệu tổ chức (danh sách, chi tiết, đơn chờ lấy)
const useInvalidateOrgContent = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orgContent"] });
};

// OC-02: values = giá trị form (campaignToForm)
export function useCreateCampaign() {
  const invalidate = useInvalidateOrgContent();
  return useMutation({
    mutationFn: async (values) =>
      orgContentApi.createCampaign(
        formToCampaignBody(values, await coverUrlOf(values.coverUri)),
      ),
    onSuccess: invalidate,
  });
}

// OC-04
export function useUpdateCampaign(id) {
  const invalidate = useInvalidateOrgContent();
  return useMutation({
    mutationFn: async (values) =>
      orgContentApi.updateCampaign(
        id,
        formToCampaignBody(values, await coverUrlOf(values.coverUri)),
      ),
    onSuccess: invalidate,
  });
}
