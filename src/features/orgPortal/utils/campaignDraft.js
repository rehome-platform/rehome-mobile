import { File, Paths } from "expo-file-system";

// Nháp chiến dịch (OC-02 "Lưu nháp") lưu NGAY TRÊN MÁY — BE không có trạng thái nháp (chỉ OPEN / CLOSED).
// Một tệp JSON trong thư mục tài liệu của app: tắt app vẫn còn; gỡ app thì mất. Mỗi máy một bản nháp,
// ghi kèm email tổ chức → đăng nhập tài khoản khác thì không thấy nháp của người trước.
// Ảnh bìa trong nháp là đường dẫn ảnh trong máy: máy dọn bộ nhớ đệm thì ảnh có thể mất, phải chọn lại
const draftFile = () => new File(Paths.document, "campaign-draft.json");

// → { values, savedAt } hoặc null (chưa có / của tài khoản khác / tệp hỏng)
export async function loadCampaignDraft(owner) {
  try {
    const file = draftFile();
    if (!file.exists) return null;
    const draft = JSON.parse(await file.text());
    return draft.owner === owner ? draft : null;
  } catch {
    return null;
  }
}

export async function saveCampaignDraft(owner, values) {
  const file = draftFile();
  if (!file.exists) file.create();
  await file.write(
    JSON.stringify({ owner, values, savedAt: new Date().toISOString() }),
  );
}

export function clearCampaignDraft() {
  try {
    const file = draftFile();
    if (file.exists) file.delete();
  } catch {}
}
