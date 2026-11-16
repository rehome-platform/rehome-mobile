import * as Location from "expo-location";

// Chạy promise, quá ms thì báo lỗi (GPS trong nhà có thể không trả về)
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Lấy vị trí quá lâu")), ms),
    ),
  ]);

// Xin quyền vị trí (chỉ khi đang mở app) → { lat, lng }. Từ chối → { denied: true }; lỗi GPS → null
export async function getCoords() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return { denied: true };
  try {
    const last = await Location.getLastKnownPositionAsync(); // nhanh, đủ để xếp theo khoảng cách
    const pos =
      last ??
      (await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        10000,
      ));
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
