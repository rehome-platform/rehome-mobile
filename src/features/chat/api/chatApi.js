// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./chatApi.real";
import * as mock from "./chatApi.mock";

const impl = MOCK.chat ? mock : real; // [CHỜ BE] API 110–113

export const chatApi = {
  getConversations: impl.getConversations,
  getConversation: impl.getConversation,
  openConversation: impl.openConversation,
  getMessages: impl.getMessages,
  sendMessage: impl.sendMessage,
  markRead: impl.markRead,
  // [DEV] chỉ dùng trong khung Mock (__DEV__)
  mockFailNextSend: mock.mockFailNextSend,
};
