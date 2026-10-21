// invalidate ["chat"] → làm mới tất cả
export const chatKeys = {
  list: ["chat", "list"],
  conversation: (id) => ["chat", "conversation", id],
  messages: (id) => ["chat", "messages", id],
};
