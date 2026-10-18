import * as Location from "expo-location";

const round6 = (n) => Math.round(n * 1e6) / 1e6;

// Địa chỉ chữ → toạ độ (BE bắt buộc latitude/longitude điểm nhận đồ). Dùng geocoder có sẵn của máy.
// Một số máy Android đòi quyền vị trí cho geocoder → lỗi lần đầu thì xin quyền rồi thử lại
export async function locateAddress(address) {
  const lookup = async () => (await Location.geocodeAsync(address))[0];
  let hit;
  try {
    hit = await lookup();
  } catch {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      throw new Error(
        "Cần cho phép quyền vị trí để xác định toạ độ điểm nhận đồ. Bật quyền rồi gửi lại.",
      );
    }
    hit = await lookup().catch(() => null);
  }
  if (!hit) {
    throw new Error(
      "Không tìm được vị trí của địa chỉ nhận đồ. Ghi rõ số nhà, đường, phường/xã, tỉnh/thành phố rồi gửi lại.",
    );
  }
  return { latitude: round6(hit.latitude), longitude: round6(hit.longitude) };
}
