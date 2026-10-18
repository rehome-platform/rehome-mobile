// Màn cần mở lại sau khi đăng nhập (vd chi tiết sản phẩm). Chỉ giữ trong RAM.
// Hết hạn sau 10 phút: Guest huỷ đăng nhập, lúc khác đăng nhập ở chỗ khác thì không bị nhảy về màn cũ
const TTL = 10 * 60 * 1000;
let pending = null;

export const setPendingRedirect = (href) => {
  pending = { href, at: Date.now() };
};

// Lấy ra một lần rồi xoá
export const takePendingRedirect = () => {
  const p = pending;
  pending = null;
  return p && Date.now() - p.at < TTL ? p.href : null;
};
