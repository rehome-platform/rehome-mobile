import { File, Paths } from "expo-file-system";

// Yêu cầu đổi pháp lý vừa gửi (OP-04) lưu thêm TRÊN MÁY. Trạng thái thật đọc từ BE (useLegalChange); tệp này
// giữ legalNameDocCount (BE không lưu) và làm dự phòng khi gọi BE lỗi. Ghi kèm email tài khoản như nháp chiến dịch
const recordFile = () => new File(Paths.document, "legal-change-request.json");

// → { id, status, proposedChanges, createdAt } hoặc null (chưa gửi / của tài khoản khác / tệp hỏng)
export async function loadLegalChangeRecord(owner) {
  try {
    const file = recordFile();
    if (!file.exists) return null;
    const record = JSON.parse(await file.text());
    return record.owner === owner ? record : null;
  } catch {
    return null;
  }
}

export async function saveLegalChangeRecord(owner, record) {
  const file = recordFile();
  if (!file.exists) file.create();
  await file.write(JSON.stringify({ owner, ...record }));
}

export function clearLegalChangeRecord() {
  try {
    const file = recordFile();
    if (file.exists) file.delete();
  } catch {}
}
