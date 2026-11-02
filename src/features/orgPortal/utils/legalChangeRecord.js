import { File, Paths } from "expo-file-system";

// Yêu cầu đổi pháp lý vừa gửi (OP-04) lưu NGAY TRÊN MÁY — BE chưa có API đọc lại yêu cầu [CHỜ BE GET].
// OP-05 / OP-01 đọc tệp này để hiện "Chờ duyệt". Ghi kèm email tài khoản như nháp chiến dịch.
// Khi BE có GET thì bỏ tệp này, đọc trạng thái thật từ server
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
