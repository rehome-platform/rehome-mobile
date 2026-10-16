import { Alert, Platform, ToastAndroid } from "react-native";

// Thông báo ngắn tự tắt. Android: Toast; iOS không có Toast → Alert
export function showToast(message) {
  if (Platform.OS === "android") ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert("", message);
}
