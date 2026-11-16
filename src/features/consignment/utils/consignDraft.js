import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import {
  orderedPhotos,
  toDraftPayload,
  withUploadedPhotos,
} from "@/features/consignment/utils/consignItem";
import { uploadPhotos } from "@/features/consignment/utils/photos";

// "Lưu món" = lưu nháp lên server (tắt app không mất): upload ảnh mới → tạo nháp, hoặc cập nhật nháp cũ (có draftId).
// Trả món đã đồng bộ: ảnh là url, có draftId
export async function saveItemDraft(item) {
  const urls = await uploadPhotos(orderedPhotos(item));
  const payload = toDraftPayload(item, urls);
  const draft = item.draftId
    ? await consignmentApi.updateDraft(item.draftId, payload)
    : await consignmentApi.createDraft(payload);
  return { ...withUploadedPhotos(item, urls), draftId: draft.id };
}
