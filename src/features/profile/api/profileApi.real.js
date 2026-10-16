import { api, unwrap } from "@/lib/api/client";

// PATCH /members/me — ô nào gửi rỗng thì BE giữ nguyên. Response thiếu email/memberCode → gọi lại getMe sau khi lưu
export const updateMe = async ({ fullName, phone }) =>
  unwrap(await api.patch("/members/me", { fullName, phone })); // không có tiền tố /api
