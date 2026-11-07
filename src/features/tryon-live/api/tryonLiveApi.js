// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./tryonLiveApi.real";
import * as mock from "./tryonLiveApi.mock";

const impl = MOCK.tryonLive ? mock : real;

export const tryonLiveApi = {
  getQuota: impl.getQuota,
  startSession: impl.startSession,
  completeSession: impl.completeSession,
  // Upload video KHÔNG đi qua đây: trang WebView (tryonLiveHtml.js) tự fetch thẳng tới BE
  // bằng accessToken được truyền sẵn, vì video là Blob tạo ra bên trong WebView.
};
