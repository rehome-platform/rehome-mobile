import { Stack } from "expo-router";

// Nhóm màn của tài khoản Tổ chức (root _layout chỉ mở nhóm này khi role = ORGANIZATION)
export default function OrgLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
