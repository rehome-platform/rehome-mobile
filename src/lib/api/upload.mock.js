// [CHỜ BE POST /uploads] mock: trả lại chính uri trong máy làm "url"
// → màn chi tiết vẫn hiện được ảnh khi chạy mock (url giả không mở được)
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function uploadFile(file) {
  await delay();
  return { url: file.uri };
}
