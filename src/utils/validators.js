// Luật kiểm tra dùng chung (CLAUDE.md): SĐT 10 số bắt đầu bằng 0; mật khẩu ≥ 8 ký tự, có chữ và số
export const PHONE_REGEX = /^0\d{9}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
