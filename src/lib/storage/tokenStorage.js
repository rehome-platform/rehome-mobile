import * as SecureStore from "expo-secure-store";

const ACCESS = "rehome_access_token";
const REFRESH = "rehome_refresh_token";

// Token lưu trong SecureStore (mã hoá bằng Android Keystore), KHÔNG dùng AsyncStorage
export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH),
  async save({ accessToken, refreshToken }) {
    await SecureStore.setItemAsync(ACCESS, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
