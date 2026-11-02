// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./notificationApi.real";
import * as mock from "./notificationApi.mock";

const impl = MOCK.notifications ? mock : real; // API 114 thật; 115–116 + số chưa đọc [CHỜ BE]

export const notificationApi = {
  getNotifications: impl.getNotifications,
  getUnreadCount: impl.getUnreadCount,
  markRead: impl.markRead,
  markAllRead: impl.markAllRead,
};
