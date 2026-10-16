// Hiển thị SĐT dễ đọc: "0912345456" → "0912 345 456". Không đúng 10 số thì giữ nguyên
export const formatPhone = (phone) =>
  (phone ?? "").replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
