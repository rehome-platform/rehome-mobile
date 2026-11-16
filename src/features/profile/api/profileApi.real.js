import { api, unwrap } from "@/lib/api/client";

// PATCH /members/me — ô nào không gửi / gửi rỗng thì BE GIỮ NGUYÊN (nên không xoá được ảnh đại diện).
// Response thiếu email/memberCode → gọi lại getMe sau khi lưu
export const updateMe = async ({ fullName, phone, avatarUrl }) =>
  unwrap(await api.patch("/members/me", { fullName, phone, avatarUrl })); // không có tiền tố /api
