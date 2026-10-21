// enum ConversationType của BE (a0c6abe: Conversation.type) [KIỂM TRA tên]
export const CONVERSATION_TYPE = {
  MEMBER_WAREHOUSE: "MEMBER_WAREHOUSE", // hộp thư kho — counterpartId = id kho
  MEMBER_ORGANIZATION: "MEMBER_ORGANIZATION", // với tổ chức — counterpartId = id tổ chức
};

// [GIẢ ĐỊNH] độ dài tin + nhịp tự hỏi lại (chưa có realtime — PHASE6_GUIDE 0.5 A18)
export const CHAT_LIMITS = {
  MAX_CHARS: 1000,
  ROOM_POLL_MS: 3000,
  LIST_POLL_MS: 30000,
};

// Cảnh báo ghim đầu phòng chat (mục 6)
export const CHAT_NOTICE = {
  MEMBER_WAREHOUSE:
    "Hỏi về đơn hàng, ký gửi, hoàn tiền. ReHome không bao giờ hỏi mật khẩu hay mã OTP.",
  MEMBER_ORGANIZATION:
    "Bạn đang nhắn với tổ chức, không phải ReHome. Hỏi về đơn hàng hoặc ký gửi hãy dùng Hộp thư kho.",
};

// Dòng phụ dưới tên ở header phòng chat [GIẢ ĐỊNH — BE chưa trả]
export const CHAT_SUBTITLE = {
  MEMBER_WAREHOUSE: "Giờ hỗ trợ 8:00–17:00 · trả lời trong ngày",
  MEMBER_ORGANIZATION: "Tổ chức · thường trả lời trong ngày",
};
