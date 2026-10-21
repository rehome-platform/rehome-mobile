// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./notificationApi.real";
import * as mock from "./notificationApi.mock";

const impl = MOCK.notifications ? mock : real; // [CHỜ BE] API 114–116

export const notificationApi = {
  getNotifications: impl.getNotifications,
  getUnreadCount: impl.getUnreadCount,
  markRead: impl.markRead,
  markAllRead: impl.markAllRead,
};
