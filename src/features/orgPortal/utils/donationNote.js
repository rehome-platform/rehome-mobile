// Ghi chú của một lượt quyên góp → { text, photos }.
// Web Moderator (DonationsPage) không có cột ảnh riêng: ảnh hiện vật được NHÚNG vào ghi chú dạng markdown
//   "2 áo khoác\n\nẢnh hiện vật: ![Hiện vật 1](https://…) ![Hiện vật 2](https://…)"
// → tách link ảnh ra để hiện ảnh thật, phần chữ bỏ cú pháp markdown. Cùng quy tắc với web để hai bên hiện giống nhau.
const IMG = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;

// BE tự ghi khi Member quyên góp món ký gửi: "Món ký gửi: {tên} · SKU {mã}" — đã có khối món riêng nên không lặp lại
const AUTO_CONSIGNED = /^Món ký gửi:.*· SKU\s+\S+$/;

export function parseDonationNote(note) {
  const raw = note ?? "";
  const photos = [...raw.matchAll(IMG)].map((m) => m[1]);
  const text = raw
    .replace(IMG, "")
    .replace(/Ảnh hiện vật:\s*/g, "")
    .trim();
  return {
    text: AUTO_CONSIGNED.test(text) ? "" : text,
    photos,
  };
}
